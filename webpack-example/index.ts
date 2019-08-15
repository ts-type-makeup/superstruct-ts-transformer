import { validate } from "superstruct-ts-transformer";

type HttpBinGetResponce = {
  args: { [key: string]: any };
  headers: {
    [key: string]: string;
  };
  origin: string;
  url: string;
};

fetch("https://httpbin.org/get")
  .then(response => response.json())
  .then(json => validate<HttpBinGetResponce>(json)) // <-- validate call!
  .then(httpBinResponse => {
    const responseStr = JSON.stringify(httpBinResponse, undefined, "  ");
    document.body.innerHTML = `<div style="color:black;">${responseStr}</div>`;
  })
  .catch(error => {
    const errorStr = error.message;
    document.body.innerHTML = `<div style="color: red;">${errorStr}</div>`;
  });
