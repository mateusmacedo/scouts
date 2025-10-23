package log

import (
	"fmt"
)

type Level int

const (
	DEBUG Level = iota
	INFO
	WARN
	ERROR
	OFF
)

type Logger struct {
	level Level
	name  string
}

func New(name string) *Logger {
	return &Logger{name: name, level: INFO}
}

func (l *Logger) SetLevel(level Level) {
	l.level = level
}

func (l *Logger) Level() Level {
	return l.level
}

func (l *Logger) Print(args ...any) {
	if l.level <= INFO {
		fmt.Println(args...)
	}
}

func (l *Logger) Printf(format string, args ...any) {
	if l.level <= INFO {
		fmt.Printf(format+"\n", args...)
	}
}

func (l *Logger) Error(args ...any) {
	if l.level <= ERROR {
		fmt.Println(args...)
	}
}

func (l *Logger) Errorf(format string, args ...any) {
	if l.level <= ERROR {
		fmt.Printf(format+"\n", args...)
	}
}

func (l *Logger) Fatalf(format string, args ...any) {
	panic(fmt.Sprintf(format, args...))
}

type LoggerInterface interface {
	SetLevel(Level)
	Level() Level
	Print(...any)
	Printf(string, ...any)
	Error(...any)
	Errorf(string, ...any)
	Fatalf(string, ...any)
}
