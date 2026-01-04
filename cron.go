package cronjs

import (
	"time"

	"github.com/worldline-go/hardloop"
)

type Cron struct {
	schedules []hardloop.Schedule
}

//go:wasmexport parseCron
func ParseCron(specs []string) (*Cron, error) {
	schedules := make([]hardloop.Schedule, 0, len(specs))
	for _, spec := range specs {
		schedule, err := hardloop.ParseStandard(spec)
		if err != nil {
			return nil, err
		}

		schedules = append(schedules, schedule)
	}

	return &Cron{
		schedules: schedules,
	}, nil
}

func (c *Cron) Next(t time.Time) time.Time {
	return hardloop.FindNext(c.schedules, t)
}

func (c *Cron) NextN(t time.Time, n int) []time.Time {
	tmpNow := t
	results := make([]time.Time, 0, n)
	for i := 0; i < n; i++ {
		tmpNow := c.Next(tmpNow)
		results = append(results, tmpNow)
	}

	return results
}

func (c *Cron) Prev(t time.Time) time.Time {
	return hardloop.FindPrev(c.schedules, t)
}

func (c *Cron) PrevN(t time.Time, n int) []time.Time {
	tmpNow := t
	results := make([]time.Time, 0, n)
	for i := 0; i < n; i++ {
		tmpNow := c.Prev(tmpNow)
		results = append(results, tmpNow)
	}

	return results
}
