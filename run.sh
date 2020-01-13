
run-rs --keep --mongod --dbpath /home/tuti/inkiri/dev/mongodata
mongo "mongodb://localhost:27017,localhost:27017,localhost:27017/?replicaSet=rs"
npm start




db.transactions.find({}).sort({transactionCounterId:-1})
db.requests.find({}).sort({requestCounterId:-1})

db.transactions.update({ _id:  ObjectId("5e189d8d9bc2f83f4c06ab48") }, {  "state": "state_not_processed" } )
db.requests.find({"_id":ObjectId("5e189c2be7c02e3df75db2b1")})





#sudo service mongod start
#run-rs --version 4.0.0 --keep --mongod /var/lib/mongodb
run-rs --keep --mongod --dbpath /home/tuti/inkiri/dev/mongodata
#run-rs --shell --keep --mongod --dbpath /home/tuti/inkiri/dev/mongodata
# run-rs --shell --mongod --dbpath /home/tuti/inkiri/dev/mongodata
# mongo --host mongod/localhost:27017,localhost:27018,localhost:27019
# mongo "mongodb://localhost:27017,localhost:27017,localhost:27017/?replicaSet=rs"
sleep 2
npm start