import sample1 from '../data-samples/three-sample.json'
import preparePlayground from '../playground'
preparePlayground({
    title: 'Strong Model Prediction',
    selector: '#playground2',
    dataSample: sample1.data,
    loadModel: 'model-strong',
    allowEdit: true
})
