package gouser

import (
	"testing"
)

func TestGoUser(t *testing.T) {
	result := GoUser("works")
	if result != "GoUser works" {
		t.Error("Expected GoUser to append 'works'")
	}
}
