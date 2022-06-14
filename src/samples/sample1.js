import sample1 from '../data-samples/three-sample.json'
import preparePlayground from '../playground'
preparePlayground({
    title: 'Weak Model Prediction',
    selector: '#playground1',
    dataSample: sample1.data,
    loadModel: 'model-weak',
    allowEdit: true
})
