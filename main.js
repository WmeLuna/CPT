// taken from https://mircodezorzi.github.io/pka2xml/main.js
const toBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

const b64toBlob = (base64, type = "application/octet-stream") =>
  fetch(`data:${type};base64,${base64}`).then((res) => res.blob());

async function loadFile(file) {
  return await file.text();
}

const PASS = "948BD7AB5359488C23F8DC7BA6D5FC7A";
// password = PacketTraced

async function edit() {
  const file = document.querySelector("#file").files[0];
  let xml;
  await fetch(
    "https://1nlsyfjbcb.execute-api.eu-south-1.amazonaws.com/default/pka2xml",
    {
      method: "POST",
      body: JSON.stringify({
        file: await toBase64(file),
        action: "decode",
      }),
    }
  )
    .then((response) => response.text())
    .then(b64toBlob)
    .then((blob) => blob.arrayBuffer())
    .then((result) => {
      const data = pako.inflate(new Uint8Array(result));
      const str = new TextDecoder("utf-8").decode(data);
      let patched = str
        .replace(/PASS="(.*?)"/g, `PASS="${PASS}"`)
        .replace(/<ADDITIONAL_INFO>(.*?)<\/ADDITIONAL_INFO>/g, "");
      xml = patched;
      console.log(patched);
    })
    .catch((err) => {
      console.log(`err: ${err}`);
    });

  const compressed = pako.deflate(new TextEncoder().encode(xml));
  const b = new Blob([compressed], { type: "application/octet-stream" });
  await fetch(
    "https://1nlsyfjbcb.execute-api.eu-south-1.amazonaws.com/default/pka2xml",
    {
      method: "POST",
      body: JSON.stringify({
        file: await toBase64(b),
        action: "encode",
        length: xml.length,
      }),
    }
  )
    .then((response) => response.text())
    .then(b64toBlob)
    .then((result) => {
      const a = document.createElement("a");
      a.download = document.querySelector("#file").files[0].name;
      a.href = window.URL.createObjectURL(result);
      a.click();
    })
    .catch((err) => {
      console.log(`err: ${err}`);
    });
}
