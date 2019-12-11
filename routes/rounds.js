var express = require('express');
var router = express.Router();
const models = require('../models/index')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
process.env.SECRET_KEY = 'secret'
const Store = require('node-localstorage').LocalStorage

var localStorage = new Store("./scratch")
/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

//list all rounds
router.get('/all', (req, res) => {
    models.Round.findAll({attributes:['competitionName'],
        group:['competitionName']
    }).then(round => {
      if(round){
          res.send(round)
      }
  })
  });

  router.post('/allByName', (req, res) => {
    models.Round.findAll({include : [
        {model : models.Team, as: 'team'}
    ],
        where : {competitionName : req.body.competitionName}, 
        order: [['rank', "ASC"]]
    }).then(round => {
      if(round){
          res.send(round)
      }
  })
  .catch(err=>{
      res.send(err)
  })
  });

  router.post('/generate', function(req, res, next) {
      
    models.Team.findAll({ 
        attributes : ['id']
    })
    .then((tms) =>{
        tms.sort(() => Math.random() - 0.5);
        values = []
        
        for (const team of tms) {
            values.push({
                TeamId: team.id, rank: (tms.indexOf(team))+1, competitionName: "round"+localStorage.getItem("round")
            })
        }
        console.log(parseInt(localStorage.getItem("round"))+1)
        localStorage.setItem("round",parseInt(localStorage.getItem("round"))+1)
        models.Round.bulkCreate(values)
        .then((ans) =>{
            res.send("enviado")
        })
        .catch((err) =>{
            console.log(err)
        })

    })
    .catch((err)=> {
        console.log(err)
    })
    
});

router.post('/register', (req, res) => {
    console.log("entrou aqui")
    const roundData = {
        competitionName: req.body.competitionName,
        TeamId: req.body.TeamId,
        rank: req.body.rank
      }
      var decoded = jwt.verify(req.headers['x-access-token'], process.env.SECRET_KEY)
  models.User.findOne({
    where: {
      id: decoded.id
    }
    }).then(user =>{
        if(user.isAdmin){
            models.Round.create(roundData).then(round => {
                res.json({ status: round.competitionName + ' Registered!'})
              })
              .catch(err => {
                res.send('error: ' + err)
              })
        }else{
            res.send('tu não és admin parceiro')
        }
    })
    .catch(err =>{
        res.send('error: ' + err)
    })

});


//delete round
router.delete('/del/',(req,res)=> {
    competition = JSON.parse(Object.keys(req.body)[0])
    var decoded = jwt.verify(req.headers['x-access-token'], process.env.SECRET_KEY)
    models.User.findOne({
      where: {
        id: decoded.id
      }
      }).then(user =>{
          if(user.isAdmin){
            models.Round.destroy({
                where: {
                    competitionName: competition.competitionName
                }
            })
            .then(resp => {
                res.json(resp)})
              .catch(erro=>{
                  res.send(erro)
              })
          }else{
              res.send('tu não és admin parceiro')
          }
      })
      .catch(err =>{
          res.send('error: ' + err)
      })
  
})

router.put('/update/:id',(req,res) =>{
var decoded = jwt.verify(req.headers['x-access-token'], process.env.SECRET_KEY)

models.User.findOne({where :
{id: decoded.id}})
.then(user=> {
    if(user.isAdmin){
        models.Round.findOne({where : {id: req.params.id}})
        .then(round =>{
            const roundData = {
                competitionName: req.body.competitionName ? req.body.competitionName : round.competitionName,
                TeamId: req.body.TeamId ? req.body.TeamId : round.TeamId,
                rank: req.body.rank ? req.body.rank : round.rank
            }
            models.Round.update({
                competitionName: roundData.competitionName,
                idTeam: roundData.TeamId,
                rank: roundData.rank
            },{where : {id: round.id}})

            .then(res.send(round))
        })
    }
    
    })



})

module.exports = router;


