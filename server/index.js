const express = require('express')
const app = express()

// the accuracy of chuncking the array , per day , per month , per year etc..
const splitIndex = 13;


app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  next()
})

const exampleData = require('../data/tracking.json')


// this function split array into small chunks of array based on accuracy pre-defined
function chunckData() {
  let data = {}
  exampleData.map((item) => {
    if (!data[item.time.substr(0, splitIndex)])
      data[item.time.substr(0, splitIndex)] = [item]
    else
      data[item.time.substr(0, splitIndex)].push(item)
  })  
  return Object.values(data);
}

app.get('/', (_req, res) => {
  // TODO(Task 1): Split tracking data into trip segments for example by using the time property.
  res.send(chunckData());
})

app.get('/location/:when', (req, res) => {
  
  // filter the element where the time reterieved is more then time requested and return first element to return the latest approx location.
  const {lon,lat} =  exampleData.filter( (item) => ! ( new Date(item.time) > new Date(parseInt(req.params.when)) ))[0]
  
  res.send([lat,lon])
})

app.listen(3000, () => console.log('Example app listening on port 3000!'))
