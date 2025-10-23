module github.com/mateusmacedo/scouts/apps/user-go-service

go 1.23

require (
        github.com/labstack/echo/v4 v4.12.0
        github.com/labstack/gommon/log v0.4.0
        github.com/mateusmacedo/scouts/libs/user-go v0.0.0
)

replace github.com/labstack/echo/v4 => ./third_party/echo
replace github.com/labstack/gommon/log => ./third_party/gommon/log
replace github.com/mateusmacedo/scouts/libs/user-go => ../../libs/user-go
