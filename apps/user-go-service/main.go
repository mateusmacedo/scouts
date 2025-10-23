package main

import (
	"fmt"

	gouser "github.com/mateusmacedo/scouts/libs/user-go"
)

func main() {
	fmt.Println(gouser.GoUser("from user-go lib"))
}

// fake value to change and force affected files
