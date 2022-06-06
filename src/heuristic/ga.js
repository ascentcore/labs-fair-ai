export class Individual {

    constructor(n_var) {
        this.genes = []
        this.evaluated = false
        this.objectives = []
        this.constraints = []
        this.fitness = 0

        for (let i = 0; i < n_var; i++) {
            this.genes.push(Math.random())
        }
    }

    set_evaluation_results(results) {
        this.evaluated = true
        this.objectives = results[0]
        this.constraints = results[1]
        this.fitness = this.objectives + this.constraints
    }
}

export class GA {

    constructor(problem,
                predict,
                population_size,
                replace_count,
                crossover_settings,
                mutation_settings) {

        this.predict = predict
        this.population = []
        this.generations = 0

        this.problem = problem

        this.population_size = population_size
        this.replace_count = replace_count
        this.crossover_settings = crossover_settings
        this.mutation_settings = mutation_settings
            
        for (let i = 0; i < population_size; i++) {
            let individual = new Individual(problem.n_var)
            this.population.push(individual)
        }

        this.calculate_obj_func()
    }

    async calculate_obj_func() {
        let predict_indices = []
        let predict_values = []

        this.population.forEach((ind, index) => {
            if (ind.evaluated == false) {
                predict_values.push(ind.genes)
                predict_indices.push(index)
            }
        })

        let data = await this.predict(predict_values)
        predict_indices.forEach((ind_index, i) => {
            let individual = this.population[ind_index]
            individual.set_evaluation_results(this.problem.evaluate(individual.genes, data[i]))
        })
    }

    run_optimization(count, onComplete) {
        this.onComplete = onComplete
        this.maxGenerations = count      
        this.iterate()
    }

    iterate() {
        if (this.generations < this.maxGenerations) {            
            this.tick()
            this.population.sort((a, b) => a.fitness - b.fitness)            
            this.onComplete(this.generations)
            setTimeout(() => {
                this.iterate();
            })            
        } else {
            this.onComplete()
        }
    }

    my_range(start, end, multiply = 1) {
        let ans = []
        for (let i = start; i < end; i += multiply) {
            ans.push(i)
        }
        return ans
    }

    mutate_genes(genes) {
        if ((this.mutation_settings.single_mutation == true) && (Math.random() < this.mutation_settings.mutation_probability)) {
            let selected_gene_idx = parseInt(Math.random() * genes.length)
            genes[selected_gene_idx] = this.mutate_value(genes[selected_gene_idx])
        }
        else {
            for (let i = 0; i < genes.length; i++) {
                if (Math.random() < this.mutation_settings.mutation_probability) {
                    genes[i] = this.mutate_value(genes[i])
                }
            }
        }

        return genes
    }

    mutate_value(value) {
        let max = 0.6
        let min = max / 2
        let new_val = value - min + Math.random() * max
        
        if (new_val < 0) {
            return 0
        } else if (new_val > 1) {
            return 1
        } else {
           return new_val
        }
    }

    tick() {
        this.generations++
        this.population.sort((a, b) => a.fitness - b.fitness)

        let rank = []
        let size = this.population.length
        for (let index = 0; index < size; index++) {
            rank.push((2 * size + 1 - 2 * index) / size / size)
        }

        let selected_parents = []
        let parent1 = null

        while (selected_parents.length < this.replace_count) {
            let rand = Math.random()
            let index = 0
            let parent = null

            while (rand > 0 && index < size) {
                parent = this.population[index]
                rand = rand - rank[index]
                index = index + 1
            }

            if (parent1 == null) {
                selected_parents.push(parent)
                parent1 = parent
            }
            else if (parent1 != parent && parent != null) {
                selected_parents.push(parent)
                parent1 = null
            }
        }

        let offspring_genes = []

        this.my_range(0, selected_parents.length, 2).forEach((i) => {
            let parent1 = selected_parents[i]
            let parent2 = selected_parents[i+1]
            
            let off_1_genes = []
            let off_2_genes = []

            
            let split_location = parseInt(Math.random() * this.problem.n_var)
            
            for (let g_index = 0; g_index < this.problem.n_var; g_index ++) {
                if (this.crossover_settings.single_crossover) {
                    if (g_index < split_location) {
                        off_1_genes.push(parent1.genes[g_index])
                        off_2_genes.push(parent2.genes[g_index])
                    }
                    else {
                        off_1_genes.push(parent2.genes[g_index])
                        off_2_genes.push(parent1.genes[g_index])
                    }
                } else {
                    if (Math.random() < 0.5) {
                        off_1_genes.push(parent1.genes[g_index])
                        off_2_genes.push(parent2.genes[g_index])
                    } else {
                        off_1_genes.push(parent2.genes[g_index])
                        off_2_genes.push(parent1.genes[g_index])
                    }
                }                            
            }
            
            offspring_genes.push(this.mutate_genes(off_1_genes))
            offspring_genes.push(this.mutate_genes(off_2_genes))

        })

        let oidx = 0
        this.my_range(size - this.replace_count, size).forEach((i) => {
            let individual = this.population[i]
            individual.genes = offspring_genes[oidx]
            individual.evaluated = false
            oidx = oidx + 1
        })

        this.calculate_obj_func()
    }
}
