package main

import (
	"testing"

	gouser "github.com/mateusmacedo/scouts/libs/user-go"
)

func TestGoUser(t *testing.T) {
	result := gouser.GoUser("john doe")
	if result != "GoUser john doe" {
		t.Error("Expected GoUser to append 'john doe', got:", result)
	}
}
