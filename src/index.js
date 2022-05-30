import { MnistData } from './data.js'
import * as tf from '@tensorflow/tfjs'
import * as tfvis from '@tensorflow/tfjs-vis'
import canvas from './canvas'
import { dtypes } from 'numjs'
import { float32 } from 'numjs'
import { OptimizationProblem } from './heuristic/problem.js'
import { GA } from './heuristic/ga.js'

const data = new MnistData()
let model = tf.sequential()

async function showExamples(data) {
    const surface =
        tfvis.visor().surface({ name: 'Input Data Examples', tab: 'Input Data' })

    const examples = data.nextTestBatch(20)
    const numExamples = examples.xs.shape[0]

    for (let i = 0; i < numExamples; i++) {
        const imageTensor = tf.tidy(() => {
            return examples.xs
                .slice([i, 0], [1, examples.xs.shape[1]])
                .reshape([28, 28, 1])
        })
        const canvas = document.createElement('canvas')
        canvas.width = 28
        canvas.height = 28
        canvas.style = 'margin: 4px;'
        await tf.browser.toPixels(imageTensor, canvas)
        surface.drawArea.appendChild(canvas)

        imageTensor.dispose()
    }
}

function getModel() {
    const IMAGE_WIDTH = 28
    const IMAGE_HEIGHT = 28
    const IMAGE_CHANNELS = 1

    model.add(tf.layers.conv2d({
        inputShape: [IMAGE_WIDTH, IMAGE_HEIGHT, IMAGE_CHANNELS],
        kernelSize: 5,
        filters: 8,
        strides: 1,
        activation: 'relu',
        kernelInitializer: 'varianceScaling'
    }))

    model.add(tf.layers.maxPooling2d({ poolSize: [2, 2], strides: [2, 2] }))

    model.add(tf.layers.conv2d({
        kernelSize: 5,
        filters: 16,
        strides: 1,
        activation: 'relu',
        kernelInitializer: 'varianceScaling'
    }))

    model.add(tf.layers.maxPooling2d({ poolSize: [2, 2], strides: [2, 2] }))

    model.add(tf.layers.flatten())

    const NUM_OUTPUT_CLASSES = 10
    model.add(tf.layers.dense({
        units: NUM_OUTPUT_CLASSES,
        kernelInitializer: 'varianceScaling',
        activation: 'softmax'
    }))

    const optimizer = tf.train.adam()
    model.compile({
        optimizer: optimizer,
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy'],
    })

    return model
}

async function train(model, data) {
    const metrics = ['loss', 'val_loss', 'acc', 'val_acc']
    const container = {
        name: 'Model Training', styles: { height: '1000px' }
    }
    const fitCallbacks = tfvis.show.fitCallbacks(container, metrics)

    const BATCH_SIZE = 512
    const TRAIN_DATA_SIZE = 5500
    const TEST_DATA_SIZE = 1000

    const [trainXs, trainYs] = tf.tidy(() => {
        const d = data.nextTrainBatch(TRAIN_DATA_SIZE)
        return [
            d.xs.reshape([TRAIN_DATA_SIZE, 28, 28, 1]),
            d.labels
        ]
    })

    const [testXs, testYs] = tf.tidy(() => {
        const d = data.nextTestBatch(TEST_DATA_SIZE)
        return [
            d.xs.reshape([TEST_DATA_SIZE, 28, 28, 1]),
            d.labels
        ]
    })

    return model.fit(trainXs, trainYs, {
        batchSize: BATCH_SIZE,
        validationData: [testXs, testYs],
        epochs: 10,
        shuffle: true,
        callbacks: fitCallbacks
    })
}

async function run() {
    await data.load()
    await showExamples(data)
    canvas.canvasComponent()
}

async function startTraining() {
    const model = getModel()
    tfvis.show.modelSummary({ name: 'Model Architecture' }, model)

    await train(model, data)
    await showAccuracy(model, data)
}

const classNames = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine']

function doPrediction(model, data, testDataSize = 500) {
    const IMAGE_WIDTH = 28
    const IMAGE_HEIGHT = 28
    const testData = data.nextTestBatch(testDataSize)
    const testxs = testData.xs.reshape([testDataSize, IMAGE_WIDTH, IMAGE_HEIGHT, 1])
    const labels = testData.labels.argMax([-1])
    const preds = model.predict(testxs).argMax([-1])

    testxs.dispose()
    return [preds, labels]
}

function doRealPrediction(model, data) {
    const xs = tf.tensor2d(data, [1, 200 * 200])
    const r = xs.reshape([1, 200, 200, 1])
    const rsmall = tf.image.resizeBilinear(r, [28, 28])
    const preds = model.predict(rsmall).argMax([-1])

    xs.dispose()
    r.dispose()
    rsmall.dispose()

    return preds
}

function doPredictions(data) {
    return doPredictions2(model, data)
}

function doPredictions2(model, data) {
    const tf_data = tf.tensor2d(data, [data.length, 28 * 28])
    const tf_data_2 = tf_data.reshape([data.length, 28, 28, 1])
    let preds = model.predict(tf_data_2).argMax([-1])
    let res = preds.dataSync()
    let res_array = Array.from(res)
    let result = res_array.map((r) => [r])

    return result
}

async function showAccuracy(model, data) {
    const [preds, labels] = doPrediction(model, data)
    const classAccuracy = await tfvis.metrics.perClassAccuracy(labels, preds)
    const container = { name: 'Accuracy', tab: 'Evaluation' }
    tfvis.show.perClassAccuracy(container, classAccuracy, classNames)

    labels.dispose()
}

async function classifyDrawing() {
    let data = canvas.getCanvasData()
    const xs = tf.tensor2d(data, [1, 200 * 200])
    const r = xs.reshape([200, 200, 1])
    const rsmall = tf.image.resizeBilinear(r, [28, 28])
    
    const values = rsmall.dataSync();
    const arr = Array.from(values);

    if (document.getElementById('data-image')) {
        document.getElementById('data-image').remove()
    }
    if (document.getElementById('data-predict')) {
        document.getElementById('data-predict').remove()
    }

    const surface2 =
        tfvis.visor().surface({ name: 'Classify Data', tab: 'Classify Data' })
    const canvas2 = document.createElement('canvas')
    canvas2.width = 28
    canvas2.height = 28    
    await tf.browser.toPixels(rsmall, canvas2)

    const img = new Image();
    img.src = canvas2.toDataURL();
    document.body.appendChild(img);
    img.setAttribute('id', 'data-image')
    img.style.width = '200px'
    img.style.height = '200px';
    surface2.drawArea.appendChild(img)
    
    const span = document.createElement('span')
    span.setAttribute('id', 'data-predict')
    span.style.position = 'fixed'
    span.style.marginTop = '85px'
    span.style.marginLeft = '10px'
    span.style.fontSize = '15px'
    span.style.fontFamily = 'monospace'
    
    let pred = doRealPrediction(model, data, 1)
    let result = pred.dataSync();
    
    span.textContent = ` => Neural Network Prediction: ${result}`
    surface2.drawArea.appendChild(span)
}

async function generateCounterfactual() {
    let data = canvas.getCanvasData()
    const xs = tf.tensor2d(data, [1, 200 * 200])
    const r = xs.reshape([200, 200, 1])
    const rsmall = tf.image.resizeBilinear(r, [28, 28])
    const values = rsmall.dataSync()

    const ref = Array.from(values)
    const ref_outcome = 0
    const target_class = 8

    const iterations = 300
    const problem = new OptimizationProblem(ref_outcome, ref, target_class)

    const algorithm = new GA(problem, doPredictions, 100, 90, { single_crossover: false }, { single_mutation: false, mutation_probability: 0.02 })
    
    algorithm.run_optimization(iterations)

    const best_individual = algorithm.population[0]
    const best_individual_genes = best_individual.genes

    const tf_data = tf.tensor2d([best_individual_genes], [[best_individual_genes].length, 28 * 28])
    const tf_data_2 = tf_data.reshape([[best_individual_genes].length, 28, 28, 1])
    let preds = model.predict(tf_data_2).argMax([-1])
    let res = preds.dataSync()
    let res_array = Array.from(res)

    console.log('best_individual', best_individual)
    console.log('Objectives: ', best_individual.objectives)
    console.log('Constraints: ', best_individual.constraints)
    console.log('Ref Outcome / New Outcome: ', ref_outcome + ' / ' + res_array[0])

    if (document.getElementById('counterfactual-image')) {
        document.getElementById('counterfactual-image').remove()
    }
    if (document.getElementById('counterfactual-image-2')) {
        document.getElementById('counterfactual-image-2').remove()
    }

    const surface3 =
        tfvis.visor().surface({ name: 'Counterfactual', tab: 'Counterfactual' })
    const canvas3 = document.createElement('canvas')
    canvas3.width = 28
    canvas3.height = 28
    await tf.browser.toPixels(rsmall, canvas3)

    const img = new Image();
    img.src = canvas3.toDataURL();
    document.body.appendChild(img);
    img.setAttribute('id', 'counterfactual-image')
    img.style.width = '200px'
    img.style.height = '200px';
    img.style.marginRight = '10px';
    surface3.drawArea.appendChild(img)


    const best_individual_xs = tf.tensor2d(best_individual.genes, [1, 28 * 28])
    const best_individual_r = best_individual_xs.reshape([28, 28, 1])
    const best_individual_image = tf.image.resizeBilinear(best_individual_r, [28, 28])
    const canvas4 = document.createElement('canvas')
    canvas4.width = 28
    canvas4.height = 28
    await tf.browser.toPixels(best_individual_image, canvas4)

    const img2 = new Image();
    img2.src = canvas4.toDataURL();
    document.body.appendChild(img2);
    img2.setAttribute('id', 'counterfactual-image-2')
    img2.style.width = '200px'
    img2.style.height = '200px';
    surface3.drawArea.appendChild(img2)
}

document.addEventListener('DOMContentLoaded', run)
window.startTraining = startTraining
window.classifyDrawing = classifyDrawing
window.clearCanvas = canvas.clearCanvas
window.generateCounterfactual = generateCounterfactual