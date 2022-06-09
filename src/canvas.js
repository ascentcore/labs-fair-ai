function canvasComponent(dataSample) {
    var canvas = document.getElementById('canvas')
    canvas.style.position = 'fixed'

    var ctx = canvas.getContext('2d')

    let imgData = ctx.createImageData(200, 200)
    let data = imgData.data

    for (let i = 0; i < 200 * 200 * 4; i++) {
        data[i] = dataSample[i]
    }
    ctx.putImageData(imgData, 0, 0)

    let rect = canvas.getBoundingClientRect()
    var pos = { x: rect.x, y: rect.y }

    document.addEventListener('mousemove', draw)
    document.addEventListener('mousedown', setPosition)
    document.addEventListener('mouseenter', setPosition)

    function setPosition(e) {
        pos.x = e.clientX
        pos.y = e.clientY
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
}

function clearCanvas() {
    var canvas = document.getElementById('canvas')
    var ctx = canvas.getContext('2d')
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function getCanvasData() {
    var canvas = document.getElementById('canvas')
    var ctx = canvas.getContext('2d')
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    let datasetBytesView = []
    for (let j = 0; j < imageData.data.length / 4; j++) {
        datasetBytesView[j] = imageData.data[j * 4] / 255
    }
    return datasetBytesView
}

module.exports = { canvasComponent, getCanvasData, clearCanvas }