import { createButton } from './components'

export function prepareInput(options) {
    const { dataSample, container, id, allowEdit, onDraw } = options

    const canvas = container.querySelector('canvas')
    var ctx = canvas.getContext('2d')

    let imgData = ctx.createImageData(200, 200)
    let data = imgData.data

    if (dataSample) {
        for (let i = 0; i < 200 * 200 * 4; i += 4) {
            const r = dataSample[i]
            const g = dataSample[i + 1]
            const b = dataSample[i + 2]
            const a = dataSample[i + 3]

            data[i] = r ? 255 : 0
            data[i + 1] = g ? 255 : 0
            data[i + 2] = b ? 255 : 0
            data[i + 3] = a
        }
        ctx.putImageData(imgData, 0, 0)
    }

    let rect = canvas.getBoundingClientRect()
    var pos = { x: rect.x, y: rect.y }

    if (allowEdit) {
        canvas.addEventListener('mousemove', draw)
        canvas.addEventListener('mousedown', setPosition)
        canvas.addEventListener('mouseenter', setPosition)
        if (onDraw) {
            canvas.addEventListener('mouseup', () => {
                onDraw(canvas)
            })
        }

        const clearButton = container.querySelector('.clear-canvas')
        clearButton.addEventListener('click', () => clearCanvas(canvas))
    }

    function setPosition(e) {
        pos.x = e.offsetX
        pos.y = e.offsetY
    }

    function draw(e) {
        if (e.buttons !== 1) return

        ctx.beginPath()

        ctx.lineWidth = 15
        ctx.lineCap = 'round'
        ctx.strokeStyle = 'white'

        ctx.moveTo(pos.x, pos.y)
        setPosition(e)
        ctx.lineTo(pos.x, pos.y)

        ctx.stroke()
    }

    return canvas;
}

export function clearCanvas(canvas) {
    // var canvas = document.getElementById('canvas')
    var ctx = canvas.getContext('2d')
    ctx.fillStyle = 'black'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
}

export function getCanvasData(canvas) {
    // var canvas = document.getElementById('canvas')
    var ctx = canvas.getContext('2d')
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    let datasetBytesView = []
    for (let j = 0; j < imageData.data.length / 4; j++) {
        datasetBytesView[j] = imageData.data[j * 4] / 255
    }
    return datasetBytesView
}
