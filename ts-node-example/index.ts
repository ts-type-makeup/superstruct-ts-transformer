import https from 'https'
import { validate } from "superstruct-ts-transformer";

type HttpBinGetResponse = {
  args: { [key: string]: any };
  headers: {
    [key: string]: string;
  };
  origin: string;
  url: string;
};

https.get("https://httpbin.org/get", res => {
  const { statusCode } = res;

  if (statusCode && statusCode < 200 && statusCode >= 300) {
    console.error(`Status code is ${statusCode}`)
    res.resume()
    return
  }

  res.setEncoding('utf8');
  let rawData = '';
  res.on('data', (chunk) => { rawData += chunk; });
  res.on('end', () => {
    try {
      const parsedData = JSON.parse(rawData);
      validate<HttpBinGetResponse>(parsedData) // <-- validate call!
      console.log(parsedData);
    } catch (e) {
      console.error(e.message);
    }
  });
}).on('error', (e) => {
  console.error(`Got error: ${e.message}`);
})