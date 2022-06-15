import sample1 from '../data-samples/three-sample.json'
import preparePlayground from '../playground'
preparePlayground({
    title: 'Counterfactual Generation',
    selector: '#playground2',
    dataSample: sample1.data,
    loadModel: 'model-strong',
    allowEdit: true
})
