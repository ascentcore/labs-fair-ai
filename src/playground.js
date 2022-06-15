import * as tf from '@tensorflow/tfjs'
import { prepareCounterfactual } from './counterfactual'
import { prepareInput } from './input'

export default async function preparePlayground(options) {
    const { selector, allowEdit, dataSample, forcePredict, loadModel, title } =
        options

    const container = document.querySelector(selector)

    if (container) {
        const model = await tf.loadLayersModel(
            `https://raw.githubusercontent.com/ascentcore/labs-fair-ai/main/assets/${
                loadModel || 'model-strong'
            }/mnist-model.json`
        )

        const documentStyles = document.querySelector('#playground-styles')
        if (!documentStyles) {
            const style = document.createElement('style')
            style.id = 'playground-styles'

            style.innerHTML = styles

            document.head.appendChild(style)
        }

        container.innerHTML = `
      <div class="playground-wrapper">
        <h3>${title}</h3>
        <div class="playground-container">
        
          <div class="canvas-container input">
            <h4>User Input</h4>
            <canvas width="200" height="200"></canvas>
            <button class="button clear-canvas">Clear Canvas</button>
            <div class="stats prediction">
            </div>
          </div>
          <div class="select-container">
            Generate:
            <select>
              <option value="any">any</option>
              <option value="0">0</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="6">6</option>
              <option value="7">7</option>
              <option value="8">8</option>
              <option value="9">9</option>
            </select>
          </div>
          <div class="canvas-container counterfactual">
            <h4>Counterfactual</h4>
            <img width="200" height="200"></img>
          
            <span class="button generate-counterfactual-button">Generate Counterfactual</span>
            <div class="stats"></div>
          </div>
        </div>
      </div>
    `

        const canvasContainer = container.querySelector(
            '.canvas-container.input'
        )
        const counterfactualContainer = container.querySelector(
            '.canvas-container.counterfactual'
        )
        const predictionContainer = container.querySelector('.prediction')
        const select = container.querySelector('select')

        const inputCanvas = prepareInput({
            container: canvasContainer,
            allowEdit,
            onDraw,
            dataSample,
        })

        if (!allowEdit) {
            container.querySelector('.select-container').remove()
            container.querySelector('.clear-canvas').remove()
        }

        const counterfactual = prepareCounterfactual({
            container: counterfactualContainer,
            input: canvasContainer,
            select,
            model,
            forcePredict,
        })

        function predict(canvas) {
            var ctx = canvas.getContext('2d')
            const imageData = ctx.getImageData(
                0,
                0,
                canvas.width,
                canvas.height
            )
            let datasetBytesView = []
            for (let j = 0; j < imageData.data.length / 4; j++) {
                datasetBytesView[j] = imageData.data[j * 4] / 255
            }
            const data = datasetBytesView
            const xs = tf.tensor2d(data, [1, 200 * 200])
            const r = xs.reshape([1, 200, 200, 1])
            const rsmall = tf.image.resizeBilinear(r, [28, 28])
            let probs = model.predict(rsmall)
            const preds = probs.argMax([-1])
            probs = probs.dataSync()

            let result = preds.dataSync()

            canvasContainer.predictData = {
                result: result[0],
                data: rsmall.dataSync(),
            }

            xs.dispose()
            r.dispose()
            rsmall.dispose()

            predictionContainer.innerHTML = `
          <div>Predicted as: ${result[0]}</div>
        `
        }

        function onDraw(canvas) {
            predict(canvas)
        }

        if (dataSample) {
            predict(inputCanvas)
        }
    }
}

const styles = `
  .playground-wrapper {
  }

  .playground-wrapper h3, .playground-wrapper h4 {
    text-align: center;
    margin: 5px 0;
  }

  .playground-container {
    display: flex;
    justify-content: center;
    margin-top: 10px;
  }

  .playground-container > div {
    border-top: 1px solid rgba(0,0,0,0.1);
    padding: 0 10px;
  }

  .playground-container .canvas-container {
    display: flex;
    flex-direction: column;
    justify-content: start;
  }

  .playground-container .select-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .playground-container .actions-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .playground-container .actions-container .prediction {
      text-align: center;
  }

  .playground-container .stats {
  }

  .playground-container .canvas-container canvas {
    border: 1px solid rgba(255, 255, 255, .3);
    cursor: crosshair;
    width: 200px;
    height: 200px;
  }

  .playground-container .button {
    padding: 10px 4px;
    margin: 10px 0;
    border: 0 none;
    cursor: pointer;
    box-shadow: 0 0 0 rgba(0,0,0, 0);
    transition: 200ms all;
    border-radius: 2px;
    text-align: center;
  }

  .playground-container .button:hover {
    box-shadow: 0px 2px 10px 0px rgba(255,255,255,0.5);
  }

  .playground-container .button:active {
    box-shadow: inset 0 0 1px rgba(0,0,0, 0.1);
  }

  .playground-container .button.clear-canvas {
    background-color: rgba(200, 0, 0, 0.7);
    color: #FFF;
  }

  .playground-container .button.generate-counterfactual-button {
    background-color: rgba(0, 100, 0, 1);
    color: #FFF;
  }

  
`
