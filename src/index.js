const express = require('express')
const bodyParser = require('body-parser')
const axios = require('axios')
const PDFKit = require('pdfkit');
const fs = require('fs')
const request = require('request')
const Path = require('path')

const PORT = process.env.PORT || 3000
const app = express();

app.use(bodyParser.json());

const router = express.Router()


const hostname = `https://api.scryfall.com`;

separator = string => {
    obj = string.split(";").map(s => {
        split = s.split(' ')

        let qnt = split[0]
        let name = ""

        for (let i = 1; i < split.length; i++)
            name += " " + split[i]

        name2 = ""

        for (let i = 1; i < name.length; i++)
            name2 += name[i]

        // console.log({ qnt, name2 })
        return {
            qnt,
            name: name2
        }
    })

    return obj
}

createPDF = async list => {
    const doc = new PDFKit({ size: 'A4', bufferPages: true });
    var names = [];
    var width = 183 //+10
    var height = 251 //+5
    var u = 0;

    for (let i = 0; i < list.length; i++)
        for (let j = 0; j < list[i].qnt; j++)
            names.push(list[i].name)

    for (let p = 0; p < names.length / 9; p++) {

        if (p >= 1)
            doc.addPage()

        for (let j = 0; j < 3; j++) {
            for (let i = 0; i < 3; i++) {

                if (u < names.length) {
                    let x = (i * width) + 10
                    let y = (j * height) + 10
                    // console.log(names[u])
                    try {
                        console.log("Escrevendo - " + names[u])
                        doc.image(`images/${names[u]}.png`, x, y, { width: width - 10, height: height - 5 })
                    } catch (err) {
                        console.log(err)
                        // console.log("Erro na carta - " + names[u])
                    }
                    u++;
                }
            }

        }
    }
    doc.pipe(fs.createWriteStream(`cards.pdf`));
    doc.end()
}

download = async (uri, filename, callback) => {
    request.head(uri, async function (err, res, body) {
        request(uri).pipe(fs.createWriteStream(`images/${filename}.png`));
        return;
    });
};


async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}

downloadList = async list => {

    try {

        await asyncForEach(list, async (e) => {
            filename = e.name

            await axios({
                url: `${hostname}/cards/named?fuzzy="${e.name}"`,
                method: 'GET',
            })
                .then(response => new Promise((resolve, reject) => {
                    console.log('baixando - ' + filename)

                    if (response.data.image_uris) {
                        request(response.data.image_uris.png).pipe(fs.createWriteStream(`images/${filename}.png`))
                            .on('finish', () => {
                                console.log("Download concluido")
                                resolve()
                            })
                            .on('error', e => {

                                reject(e)
                            })
                    } else {
                        console.log("Imagem nao encontrada")
                        resolve()
                    }
                }))
            return;
        }).then(() => createPDF(list))



        // list.forEach(async e => {
        //     const data = await axios.get(`${hostname}/cards/named?fuzzy="${e.name}"`);
        //     await download(data.data.image_uris.png, e.name)
        // });

    } catch (err) {
        console.log(err.toString())
        return;
    }


}


leitorDeArquivo = async () => {

    fs.readFile('./lista.txt', 'utf8', async function (err, data) {
        //Enviando para o console o resultado da leitura
        data = data.split('\r').map((t, index) => {

            return {
                qnt: index == 0 ? t[0] : t[1],
                name: index == 0 ? t.slice(2, t.length) : t.slice(3, t.length)
            }
        })

        // console.log(data)
        await downloadList(data)
        // createPDF(data)


    });


}

app.get('/list/:list?', async (req, res) => {



    fs.readFile('./lista.txt', 'utf8', function (err, data) {
        //Enviando para o console o resultado da leitura
        data = data.split('\n').map((t, index) => {
            return {
                qnt: t[0],
                name: t.slice(2, t.length)
            }
        })
        console.log(data)
        // pdfGen(obj)
    });

    // const list = separator(req.params.list)

    // console.log(list)
    // pdfGen(list)

    res.send({})


})





app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});


leitorDeArquivo()