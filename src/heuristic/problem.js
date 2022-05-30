
export class OptimizationProblem {
    constructor(ref_class, domain_reference, target_class) {
      this.n_var = domain_reference.length;
      this.n_obj = 1;
      this.n_constr = 1;
      this.ref_class = ref_class;
      this.domain_reference = domain_reference;
      this.target_class = target_class;

    }
    
    diffNumber(arr1, arr2) { 
        return arr1.map(function (num, idx) { return num - arr2[idx] }) 
    }
    diffBool(arr1, arr2) {
        return arr1.map(function (num, idx) { return num != arr2[idx] }) 
    }
    sum(arr) {
        return arr.reduce((a, b)=> a + b)
    }
    abs(arr) {
        return arr.map(num => Math.abs(num))
    }
    
    evaluate(x, outcome) {
        let std_val = this.abs(this.diffNumber(x, this.domain_reference))
        if (this.target_class != null) { 
            let obj = this.sum(std_val)
            let cons = (outcome[0] != this.target_class) ? this.sum(this.diffBool(x, this.domain_reference)) : 0
            return [obj, cons * 1000]
        }
        else {
            return [this.sum(std_val), (outcome[0] == this.ref_class) ? this.sum(this.diffBool(x, this.domain_reference)) * 1000 : 0]
        }
    }
}
