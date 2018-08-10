// Copyright 2013 The Gorilla WebSocket Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package main

import (
	"flag"
	"log"
	"net/http"
	"os"
)

var addr = flag.String("addr", ":8080", "http service address")

func serveHome(w http.ResponseWriter, r *http.Request) {
	//log.Println(r.URL)

	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	switch os := r.URL.Path; os {
	case "/mmo/":
		http.ServeFile(w, r, "mmo.html")
	case "/home/":
		http.ServeFile(w, r, "home.html")
	case "/drawPlatformer/":
		http.ServeFile(w, r, "./drawing-platformer/index.html")
	case "/dungeon/":
		http.ServeFile(w, r, "./dungeon/index.html")
	default:
		http.Error(w, "Not found", http.StatusNotFound)
		return
	}

}

func serveMMO(w http.ResponseWriter, r *http.Request) {

}
func faviconHandler(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "favicon.ico")
}

func main() {
	http.HandleFunc("/favicon.ico", faviconHandler)
	println("we in main")
	flag.Parse()
	hub := newHub()
	go hub.run()
	http.HandleFunc("/home/", serveHome)
	http.HandleFunc("/mmo/", serveHome)
	http.HandleFunc("/drawPlatformer/", serveHome)
	http.HandleFunc("/dungeon/", serveHome)

	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		serveWs(hub, w, r)
	})

	fs := http.FileServer(http.Dir("static/"))
	http.Handle("/", http.StripPrefix("/static/", fs))
	println("about to listen and server")
	port := "3000"
	if os.Getenv("PORT") != "" {
		port = os.Getenv("PORT")
	}
	err := http.ListenAndServe(":"+port, nil)
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
	println("not sure whats not starting")
}
