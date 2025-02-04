import ky from "ky"

const END_POINT = "http://localhost:5678/webhook/e813d5c0-54c3-40e6-9399-54701d6c5675"

export class Messenger {
    constructor(){}
    
    post() {
        return ky.post(END_POINT, { json: { message: "Hello, World!"} })
        .then((res) => {
            console.log("FFFFF", res)
        })
    }
}