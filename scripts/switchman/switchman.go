package main

import (
	"github.com/codegangsta/martini"
	"github.com/timonv/pusher"
	"io/ioutil"
	"net/http"
	"os"
)

func HookHandler(pusher *pusher.Client, r *http.Request, params martini.Params) (int, string) {

	body, _ := ioutil.ReadAll(r.Body)
	channel := params["token"]

	go func() {
		err := pusher.Publish(string(body), "build", channel)

		PanicIf(err)
	}()

	return 200, "i'm a switchman"
}

func PanicIf(err error) {
	if err != nil {
		panic(err)
	}
}

func SetupPusher() *pusher.Client {
	app_id := os.Getenv("PUSHER_APP_ID")
	key := os.Getenv("PUSHER_KEY")
	secret := os.Getenv("PUSHER_SECRET")

	return pusher.NewClient(app_id, key, secret)
}

func main() {
	m := martini.Classic()
	m.Map(SetupPusher())

	m.Post("/:token", HookHandler)

	m.Get("/", func() string {
		return "Hello world!"
	})

	m.Run()
}
