
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
        return arr1.map(function (num, idx) { return parseInt(num*10) != parseInt(arr2[idx]*10) }) 
    }
    sum(arr) {
        return arr.reduce((a, b)=> a + b)
    }
    abs(arr) {
        return arr.map(num => Math.abs(num))
    }

    argMax(array) {
        return [].reduce.call(array, (m, c, i, arr) => c > arr[m] ? i : m, 0)
    }
    
    evaluate(x, outcome) {
        let argmaxVal = this.argMax(outcome)
        let std_val = this.abs(this.diffNumber(x, this.domain_reference))
        if (this.target_class != null) { 
            let obj = this.sum(std_val)
          
            let diff = 1/outcome[this.target_class]
            let cons = diff
            if (argmaxVal === this.target_class) { 
                cons = 0
                obj += diff * 10
            }
            if (Math.floor(cons) === 1) {
                cons = 0;
            }
            return [obj, cons * 10000]
        }
        else {            

            return [this.sum(std_val), (argmaxVal === this.ref_class) ? this.sum(this.diffBool(x, this.domain_reference)) * 1000 : 0]
        }
    }
}
