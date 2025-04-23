const express = require('express');
const app = express();
const port = process.env.PORT || 3000; 

app.get('/getInfo', (req, res) => {
  let vcapString = process.env.VCAP_SERVICES;
  vcapServices = vcapString ? JSON.parse(vcapString) : vcapServices;
  let credentials, tenantid, instanceid;
  if (vcapServices && vcapServices["xsuaa"] && vcapServices["xsuaa"].length>0) {
    credentials = vcapServices["xsuaa"][0]["credentials"];
  }

  tenantid =  credentials ? credentials["subaccountid"] : "";
  instanceid = credentials ? credentials["serviceInstanceId"] : "";
  res.send({tenantid, instanceid});
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});