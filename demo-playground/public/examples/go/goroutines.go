// Concurrent Programming with Goroutines and Channels
// Demonstrates Go's concurrency primitives

package main

import (
	"fmt"
	"sync"
	"time"
)

// Worker pool pattern
type Job struct {
	ID   int
	Data string
}

type Result struct {
	JobID int
	Value string
	Error error
}

func worker(id int, jobs <-chan Job, results chan<- Result, wg *sync.WaitGroup) {
	defer wg.Done()

	for job := range jobs {
		fmt.Printf("Worker %d processing job %d\n", id, job.ID)

		time.Sleep(100 * time.Millisecond)

		results <- Result{
			JobID: job.ID,
			Value: fmt.Sprintf("Processed: %s", job.Data),
			Error: nil,
		}
	}
}

func main() {
	const numWorkers = 3
	const numJobs = 10

	jobs := make(chan Job, numJobs)
	results := make(chan Result, numJobs)

	var wg sync.WaitGroup

	for i := 1; i <= numWorkers; i++ {
		wg.Add(1)
		go worker(i, jobs, results, &wg)
	}

	for i := 1; i <= numJobs; i++ {
		jobs <- Job{
			ID:   i,
			Data: fmt.Sprintf("task-%d", i),
		}
	}
	close(jobs)

	go func() {
		wg.Wait()
		close(results)
	}()

	for result := range results {
		if result.Error != nil {
			fmt.Printf("Job %d failed: %v\n", result.JobID, result.Error)
		} else {
			fmt.Printf("Job %d result: %s\n", result.JobID, result.Value)
		}
	}

	fmt.Println("All jobs completed")
}

// Fan-out, fan-in pattern
func generate(nums ...int) <-chan int {
	out := make(chan int)
	go func() {
		for _, n := range nums {
			out <- n
		}
		close(out)
	}()
	return out
}

func square(in <-chan int) <-chan int {
	out := make(chan int)
	go func() {
		for n := range in {
			out <- n * n
		}
		close(out)
	}()
	return out
}

func merge(channels ...<-chan int) <-chan int {
	var wg sync.WaitGroup
	out := make(chan int)

	output := func(c <-chan int) {
		defer wg.Done()
		for n := range c {
			out <- n
		}
	}

	wg.Add(len(channels))
	for _, c := range channels {
		go output(c)
	}

	go func() {
		wg.Wait()
		close(out)
	}()

	return out
}
