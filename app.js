const express = require('express')
const bodyParser = require('body-parser');
const fs = require('fs')

const path = require('path');

const app = express()
const port = 8080

const OUTPUT_DIR = './output';

const PROJECT_DIR = './project';

app.use('/res', express.static(path.join(__dirname, 'res')));
app.use('/libs', express.static(path.join(__dirname, 'libs')));
app.use('/', express.static(path.join(__dirname, '/')));

app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
})

app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
})

app.post('/project', (req, res) => {
  console.log(req.body)
  let fileName = ''
  if (req.body.project_id) {
    fileName = `${req.body.project_id}.json`
  } else {
    fileName = randomFileName()
  }
  let projectName = `${PROJECT_DIR}/${fileName}`
  let data = req.body;
  data['project_id'] = fileName.slice(0, -5);
  fs.writeFile(projectName, JSON.stringify(data), (err) => {  
    if (err) {
      res.status(400).send({
        success: true,
        message: 'Error happened while saving'
      })
    } else {
      res.status(200).send({
        success: true,
        project: data
      })
    }
  });
})

app.get('/projects', (req, res) => {
  let projects = readProjectList(PROJECT_DIR)
  res.status(200).send({
    success: true,
    projects: projects
  })
})

app.post('/delete', (req, res) =>{
  if(req.body.projectId) {
    let fileName = `${req.body.projectId}.json`;
    let taskFileName = `${OUTPUT_DIR}/${fileName}`;
    let projectFileName =  `${PROJECT_DIR}/${fileName}`;
    try {
      if (fs.existsSync(projectFileName)){
        fs.unlinkSync(projectFileName); 
      }
      if (fs.existsSync(taskFileName)) {
         fs.unlinkSync(taskFileName); 
      }
      res.status(200).send({
        success: true,
      })
    } catch (e) {
      res.status(400).send({
        success: false,
        message: `Error happened while retrieving data ${JSON.stringify(e)}`
      })
    }
  }
})

app.post('/tasks', (req, res)=>{
  if(req.body.projectId) {
    let fileName = `${req.body.projectId}.json`
    try {
      console.log(`${OUTPUT_DIR}/${fileName}`)
      if (fs.existsSync(`${OUTPUT_DIR}/${fileName}`)) {
        let project = fs.readFileSync(`${OUTPUT_DIR}/${fileName}`); 
        if (project) { 
          res.status(200).send({
            success: true,
            project: JSON.parse(project)
          })
        }
      } else {
        console.log('no file exist')
        res.status(200).send({
          success: true,
          message: `Have not created a file yet`
        })
      }
    } catch (e) {
      res.status(400).send({
        success: false,
        message: `Error happened while retrieving data ${JSON.stringify(e)}`
      })
    }
  }
})

app.get('/ganttAjaxController', (req, res)=>{
  if(req.query.id) {
    let fileName = `${req.query.id}.json`
    try {
      if (fs.existsSync(`${OUTPUT_DIR}/${fileName}`)) {
        let project = fs.readFileSync(); 
        console.log(project)
        if (project) { 
          res.status(200).send({
            success: true,
            project: JSON.parse(project)
          })
        }
      } else {
        res.status(400).send({
          success: false,
          message: `create a new file`
        })
      }
    } catch (e) {
      res.status(400).send({
        success: false,
        message: `Error happened while retrieving data ${JSON.stringify(e)}`
      })
    }
  }
})

app.get('/export', async(req, res)=> {
  if(req.query.projectId) {
    let fileName = `${req.query.projectId}.json`;
    let taskFileName = `${OUTPUT_DIR}/${fileName}`;
    let projectFileName =  `${PROJECT_DIR}/${fileName}`;
    try {
      // if (fs.existsSync(taskFileName) && fs.existsSync(projectFileName)) {
        let taskJsonString = fs.readFileSync(taskFileName); 
        let projectJsonString = fs.readFileSync(projectFileName); 
        let project = `Project data: </br>${projectJsonString}` + '</br>' + `Task data: </br>${taskJsonString}`
        res.status(200).send({
          success: true,
          project: project
        })
        // result = {
        //   project: projectJsonString,
        //   tasks: taskJsonString
        // }
        // console.log(result)
        // res.status(200).send({
        //   success: true,
        //   result: result
        // })
      // }
      //  else {
      //   console.log('no file exist')
      //   res.status(200).send({
      //     success: true,
      //     message: `Have not created a file yet`
      //   })
      // }
    } catch (e) {
      res.status(400).send({
        success: false,
        message: `Error happened while retrieving data ${JSON.stringify(e)}`
      })
    }
  }
})


app.post('/ganttAjaxController', async(req, res) => {
  let fileName = ''
  if(req.body.projectId) {
    fileName = `${OUTPUT_DIR}/${req.body.projectId}.json`
  } else {
    fileName = ouputFileName(OUTPUT_DIR)
  }
  fs.writeFile(fileName, req.body.prj, (err) => {  
    if (err) {
      res.status(400).send({
        success: true,
        message: 'Error happened while saving'
      })
    } else {
      res.status(200).send({
        success: true,
        project: req.body.prj
      })
    }
  });
})

app.listen(port, () => console.log(`app listening on port ${port}!`))

//
function ouputFileName(dir) {
  if (!fs.existsSync(dir)){
      fs.mkdirSync(dir);
  }
  return `${dir}/${randomFileName()}`
}

function randomFileName() {
  let fileName = Math.random().toString(15).substring(2, 6) + Math.random().toString(15).substring(2, 6);
  return `${fileName}.json`
}

function projectFileList(dir) {
  if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
  }
  try {
    var sorted =  fs.readdirSync(dir).map(function (fileName) {
      return {
        name: fileName,
        time: fs.statSync(dir + '/' + fileName).mtime.getTime()
      };
    })
    .sort(function (a, b) {
      return b.time - a.time; })
    .map(function (v) {
      return v.name; }
    );
    return sorted;
  } catch (e) {
    throw err;
  }
}

function readProjectList(dir) {
  let elements = []
  let fileList = projectFileList(dir)
  fileList.forEach(file => {
    try {
      let jsonString = fs.readFileSync(`${dir}/${file}`);
      let json = JSON.parse(jsonString)
      elements.push(json);
    } catch (e) {
      throw e;
    }
  });
  return elements;
}
