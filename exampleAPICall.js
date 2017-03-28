'use strict';

var async = require('async'),
  request = require('request'),
  fs = require('fs'),
  username = '', //Your Public Key here. Replace with an environment variable before committing or using in production.
  password = ''; //Your Private Key here. Replace with an environment variable before committing or using in production.

function run(callback) {

  var exampleNetworkData = {
    'nodes':[
      {
        'id': 'Joe',
        'attributes':
        {
          'Example Numerical Attribute Name': 24,
          'Example Categorical Attribute Name': 'Value 1',
          'Name': 'Joe'
        }
      },
      {
        'id':'Mary',
        'attributes':
        {
          'Example Numerical Attribute Name':38,
          'Example Categorical Attribute Name':'Value 1',
          'Name':'Mary'
        }
      },
      {
        'id':'Bill',
        'attributes':
        {
          'Example Numerical Attribute Name':65,
          'Example Categorical Attribute Name':'Value 2',
          'Name':'Bill'
        }
      },
      {
        'id':'Grant',
        'attributes':
        {
          'Example Numerical Attribute Name':52,
          'Example Categorical Attribute Name':'Value 2',
          'Name':'Grant'
        }
      }
    ],
    'edges':[
      {
        'id':0,
        'source':'Joe',
        'target':'Mary',
        'attributes':
        {
          'Example Numerical Attribute Name':30,
          'Example Categorical Attribute Name':'Value 1'
        }
      },
      {
        'id':1,
        'source':'Grant',
        'target':'Mary',
        'attributes':
        {
          'Example Numerical Attribute Name':34,
          'Example Categorical Attribute Name':'Value 1'
        }
      },
      {
        'id':2,
        'source':'Bill',
        'target':'Joe',
        'attributes':
        {
          'Example Numerical Attribute Name':38,
          'Example Categorical Attribute Name':'Value 2'
        }
      }
    ]
  };

  async.waterfall([
    //Create a network
    function(cb) {
      request({
        url: 'https://www.polinode.com/api/v1/networks',
        method: 'POST',
        body: {
          name: 'My new network', //Required
          status: 'Public', //Optional - defaults to Public
          fileType: 'JSON', //Optional - defaults to JSON
          originalFileType: 'JSON', //Optional - defaults to Excel
          isDirected: 'true', //Optional - defaults to true
          description: 'An example network created via the Polinode API' //Optional - defaults to no description
        },
        json: true,
        auth: {
          'user': username,
          'pass': password
        }
      }, function(error, response, body) {
        if(error) {
          cb(error);
        } else {
          var network = body;
          var networkId = network._id;
          console.log('Summary of network created:');
          console.log(JSON.stringify(network, null, 2));
          request({
            url: network.AWSURL,
            method: 'PUT',
            headers: {'Content-Type': 'application/json; charset=UTF-8'},
            body: exampleNetworkData,
            json: true
          }, function(error, response, body) {
            if(error) {
              cb(error);
            } else {
              cb(null, networkId);
            }
          });
        }
      });
    },
    //Edit the network we just created. We will change the name of the network and change one attribute value
    function(networkId, cb) {
      request({
        url: 'https://www.polinode.com/api/v1/networks/URLForUpdate/' + networkId,
        method: 'PUT',
        json: true,
        auth: {
          'user': username,
          'pass': password
        }
      }, function(error, response, body) {
        if(error) {
          cb(error);
        } else {
          var newNetworkUUID = body.networkUUID;
          // var networkId = network._id;
          exampleNetworkData.nodes[0].attributes['Example Numerical Attribute Name'] = 25;
          request({
            url: body.AWSURL,
            method: 'PUT',
            headers: {'Content-Type': 'application/json; charset=UTF-8'},
            body: exampleNetworkData,
            json: true
          }, function(error, response, body) {
            if(error) {
              cb(error);
            } else {
              request({
                url: 'https://www.polinode.com/api/v1/networks/' + networkId,
                method: 'PUT',
                body: {
                  name: 'My new network after edits',
                  networkUUID: newNetworkUUID
                },
                json: true,
                auth: {
                  'user': username,
                  'pass': password
                }
              }, function(error, response, body) {
                if(error) {
                  cb(error);
                } else {
                  var network = body;
                  console.log('Summary of updated network:');
                  console.log(JSON.stringify(network, null, 2));
                  cb(null, networkId);
                }
              });
            }
          });
        }
      });
    },
    //Example of retrieving a summary of all networks for a user
    function(networkId, cb) {
      request({
        url: 'https://www.polinode.com/api/v1/networks',
        method: 'GET',
        json: true,
        auth: {
          'user': username,
          'pass': password
        }
      }, function(error, response, body) {
        if(error) {
          cb(error);
        } else {
          var networks = body;
          console.log('Summary of networks:');
          console.log(JSON.stringify(networks, null, 2));
          cb(null, networkId);
        }
      });
    },
    //Example of retrieving a specific network for a user. Authentication is not required for this action if this is a public network.
    function(networkId, cb) {
      request({
        url: 'https://www.polinode.com/api/v1/networks/' + networkId,
        method: 'GET',
        json: true,
        auth: {
          'user': username,
          'pass': password
        }
      }, function(error, response, body) {
        if(error) {
          cb(error);
        } else {
          var network = body;
          console.log('Summary for a single network:');
          console.log(JSON.stringify(network, null, 2));
          //Retrieve actual network data from Cloudfront
          request({
            url: network.AWSURL,
            method: 'GET',
            gzip: true
          }, function(error, response, body) {
            if(error) {
              cb(error);
            } else {
              var networkData = JSON.parse(body);
              console.log('Actual network data:');
              console.log(JSON.stringify(networkData, null, 2));
              cb(null, networkId);
            }
          });
        }
      });
    },
    //Delete the network that we created. Comment this function out to not delete the created network, i.e. to view it in the application
    function(networkId, cb) {
      request({
        url: 'https://www.polinode.com/api/v1/networks/' + networkId,
        method: 'DELETE',
        auth: {
          'user': username,
          'pass': password
        }
      }, function(error, response, body) {
        if(error) {
          cb(error);
        } else {
          console.log('Network deleted');
          var networkData = JSON.parse(body);
          console.log(JSON.stringify(networkData, null, 2));
          cb(null);
        }
      });
    },
    //Load a GEXF file and upload it as a network
    function(cb) {
      fs.readFile('./diseasome.gexf', function (error, data) {
        if (error) {
          cb(error);        
        } else {
          request({
            url: 'https://www.polinode.com/api/v1/networks',
            method: 'POST',
            body: {
              name: 'My new GEXF network', //Required
              status: 'Public', //Optional - defaults to Public
              fileType: 'GEXF', //Optional - defaults to JSON
              originalFileType: 'JSON', //Optional - defaults to Excel
              isDirected: 'false', //Optional - defaults to true
              description: 'The human disease network. See Human Disease Network, Goh K-I, Cusick ME, Valle D, Childs B, Vidal M, Barabási A-L (2007), Proc Natl Acad Sci USA 104:8685-8690' //Optional - defaults to no description
            },
            json: true,
            auth: {
              'user': username,
              'pass': password
            }
          }, function(error, response, body) {
            if(error) {
              cb(error);
            } else {
              var network = body;
              console.log('Summary of GEXF network created:');
              console.log(JSON.stringify(network, null, 2));
              request({
                url: network.AWSURL,
                method: 'PUT',
                headers: {'Content-Type': 'application/json; charset=UTF-8'},
                body: data.toString(),
              }, function(error, response, body) {
                if(error) {
                  cb(error);
                } else {
                  cb(null);
                }
              });
            }
          });
        }
      }); 
    }
  ], function(err) {
    callback(err);
  });
}

run(function (err) {
  if (err) { throw err; }
  process.exit();
});