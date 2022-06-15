import { GA } from './heuristic/ga'
import * as tf from '@tensorflow/tfjs'
import { OptimizationProblem } from './heuristic/problem'

export function prepareCounterfactual(options) {
    const { container, input, model, forcePredict, select } = options

    const canvas = document.createElement('canvas')
    const counterfactual_img = container.querySelector('img')
    const span = container.querySelector('.stats')
    const generateCounterfactualButton = container.querySelector(
        '.generate-counterfactual-button'
    )

    const doPredictions = (data) => {
        const tf_data = tf.tensor2d(data, [data.length, 28 * 28])
        const tf_data_2 = tf_data.reshape([data.length, 28, 28, 1])
        let preds = model.predict(tf_data_2)

        return preds.arraySync()
    }

    generateCounterfactualButton.addEventListener('click', () => {
        const { result, data } = input.predictData

        const iterations = 3000
        const target =
            forcePredict !== undefined
                ? forcePredict
                : select.value !== 'any'
                ? parseInt(select.value)
                : null

        console.log('targeting', target)
        const problem = new OptimizationProblem(
            result,
            Array.from(data),
            target
        )

        const algorithm = new GA(
            problem,
            doPredictions,
            100,
            90,
            { single_crossover: false },
            { single_mutation: false, mutation_probability: 0.002 }
        )

        algorithm.run_optimization(iterations, async (iteration) => {
            if (!iteration || iteration % 20 == 0) {
                const best_individual = algorithm.population[0]
                const best_individual_genes = best_individual.genes

                const tf_data = tf.tensor2d(
                    [best_individual_genes],
                    [[best_individual_genes].length, 28 * 28]
                )
                const tf_data_2 = tf_data.reshape([
                    [best_individual_genes].length,
                    28,
                    28,
                    1,
                ])
                let preds = model.predict(tf_data_2).argMax([-1])
                let res = preds.dataSync()
                let res_array = Array.from(res)

                const best_individual_xs = tf.tensor2d(best_individual.genes, [
                    1,
                    28 * 28,
                ])
                const best_individual_r = best_individual_xs.reshape([
                    28, 28, 1,
                ])
                const best_individual_image = tf.image.resizeBilinear(
                    best_individual_r,
                    [28, 28]
                )

                await tf.browser.toPixels(best_individual_image, canvas)
                counterfactual_img.src = canvas.toDataURL()

                span.innerHTML = `
                    <div>Predicted as: ${res_array[0]}</div>
                    <div>Changes: ${parseInt(best_individual.fitness)}</div>
                    <div>Progress: ${
                        iteration < iterations
                            ? parseInt((iteration * 100) / iterations) + '%'
                            : 'Finished'
                    }</div>
                `
            }
        })
    })
}
