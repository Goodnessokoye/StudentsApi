const http = require("http");
const url = require("url");
const { parse } = require("querystring");
const promisify = require("util").promisify;
const fs = require("fs");
const open = promisify(fs.open);
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const close = promisify(fs.close);
const unlink = promisify(fs.unlink);
​
const CRUD_Handlers = {
    POST: postHandler,
    GET: getHandler,
    PUT: putHandler,
    DELETE: deleteHandler 
};
​
const port = 3000;
const host = "localhost";
​
const server = http.createServer((req, res) => {
    if (Object.keys(CRUD_Handlers).includes(req.method)) {
        CRUD_Handlers[req.method.toUpperCase()](req, res);
    }else{
        res.statusCode = 405;                                                                       
        res.setHeader("Content-Type", "text/plain");
        res.end(`${req.method} requests are not allowed`);
    }
})
​
server.listen(port, host, () => {
    console.log(`Server running at http://${host}:${port}/`);
});
​
function postHandler(req, res) {
    let body = ""
​
    req.on("data", chunk => {
        body += chunk.toString();
    });
​
    req.on("end", () => {
        let fd;
        open(`./.data${req.url}.json`, 'wx+')
        .then(fileDescriptor => {
            fd = fileDescriptor
            return writeFile(fd, body);
        })
        .then(() => {
            res.statusCode = 200;
            res.setHeader("Content-Type", "text/plain");
            res.end("Done");
            close(fd);
        })
        .catch(err => {
            res.statusCode = 404;
            res.setHeader("Content-Type", "text/plain");
            res.end("Invalid request")
            console.log(err);
        })
    })
}
​
function getHandler(req, res) {
    let fd;
    open(`./.data${req.url}.json`, 'r+')
    .then(fileDescriptor => {
        fd = fileDescriptor
        return readFile(fd, "utf-8")
    })
    .then(data => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.end(data);
        console.log(data);
        close(fd);
    })
    .catch(err => {
        res.statusCode = 404;
        res.setHeader("Content-Type", "text/plain");
        res.end("Not found")
        console.log(err);
    })
}
​
function putHandler(req, res) {
    let body = ""
​
    req.on("data", chunk => {
        body += chunk.toString();
    });
​
    req.on("end", () => {
        let fd;
        body = parsejsonObject(body);
        open(`./.data${req.url}.json`, 'r+')
        .then(fileDescriptor => {
            fd = fileDescriptor
            return readFile(fd, "utf-8")
        })
        .then(data => {
            data = parsejsonObject(data);
            // Check if the property-names of Object sent tally with Object requested
            for (key of Object.keys(body)) {
                if (!data.hasOwnProperty(key)) {
                    throw new Error(`Invalid property name "${key}"`);
                }
            }
            
            // Update all properties of data with values from PUT request body
            for (key of Object.keys(body)) {
                data[key] = body[key];
            }
            
            var stringData = JSON.stringify(data, null, "\t");
            console.log(stringData);
            return writeFile(fd, stringData);
        })
        .then(() => {
            return close(fd);
        })
        .then(() => {
            res.statusCode = 200;
            res.setHeader("Content-Type", "text/plain");
            res.end(`Successfully updated user with id = ${req.url.split("/")[2]}`);
        })
        .catch(err => {
            res.statusCode = 404;
            res.setHeader("Content-Type", "text/plain");
            res.end("Invalid PUT request")
            console.log(err);
        })
    })
}
​
function deleteHandler(req, res) {
    unlink(`./.data${req.url}.json`)
    .then(() => {
        let id = req.url.split("/")[2];
        res.statusCode = 200;
        res.setHeader("Content-Type", "text/plain");
        res.end(`Successfully deleted user with id = ${id}`);
    })
    .catch(err => {
        res.statusCode = 404;
        res.setHeader("Content-Type", "text/plain");
        res.end("Student not found or invalid request");
        console.log(err);
    })
}
​
function parsejsonObject (str){
    try {
        var obj = JSON.parse(str);
        return obj;
    } catch (error) {
        return {}
    }
}