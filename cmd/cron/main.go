package main

import (
	"time"
	"unsafe"

	"github.com/worldline-go/hardloop"
)

func main() {}

type Cron struct {
	schedules []hardloop.Schedule
}

//export createCron
func CreateCron() uintptr {
	c := &Cron{
		schedules: make([]hardloop.Schedule, 0),
	}
	return uintptr(unsafe.Pointer(c))
}

//export addSpec
func AddSpec(cronPtr uintptr, specPtr *byte, specLen int32) int32 {
	c := (*Cron)(unsafe.Pointer(cronPtr))
	spec := ptrToString(specPtr, specLen)

	schedule, err := hardloop.ParseStandard(spec)
	if err != nil {
		return 0
	}

	c.schedules = append(c.schedules, schedule)
	return 1
}

//export cronNext
func CronNext(cronPtr uintptr, unixSec int64) int64 {
	c := (*Cron)(unsafe.Pointer(cronPtr))
	t := time.Unix(unixSec, 0)
	next := c.Next(t)
	return next.Unix()
}

//export cronPrev
func CronPrev(cronPtr uintptr, unixSec int64) int64 {
	c := (*Cron)(unsafe.Pointer(cronPtr))
	t := time.Unix(unixSec, 0)
	prev := c.Prev(t)
	return prev.Unix()
}

//export cronNextN
func CronNextN(cronPtr uintptr, unixSec int64, n int32, index int32) int64 {
	c := (*Cron)(unsafe.Pointer(cronPtr))
	t := time.Unix(unixSec, 0)
	times := c.NextN(t, int(n))
	if int(index) >= len(times) {
		return 0
	}
	return times[index].Unix()
}

//export cronPrevN
func CronPrevN(cronPtr uintptr, unixSec int64, n int32, index int32) int64 {
	c := (*Cron)(unsafe.Pointer(cronPtr))
	t := time.Unix(unixSec, 0)
	times := c.PrevN(t, int(n))
	if int(index) >= len(times) {
		return 0
	}
	return times[index].Unix()
}

func (c *Cron) Next(t time.Time) time.Time {
	return hardloop.FindNext(c.schedules, t)
}

func (c *Cron) NextN(t time.Time, n int) []time.Time {
	tmpNow := t
	results := make([]time.Time, 0, n)
	for i := 0; i < n; i++ {
		tmpNow = c.Next(tmpNow)
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
		tmpNow = c.Prev(tmpNow)
		results = append(results, tmpNow)
	}

	return results
}

func ptrToString(ptr *byte, len int32) string {
	if ptr == nil || len == 0 {
		return ""
	}
	return unsafe.String(ptr, len)
}
