
run-rs --keep --mongod --dbpath /home/tuti/inkiri/dev/mongodata
mongo "mongodb://localhost:27017,localhost:27017,localhost:27017/?replicaSet=rs"
npm start






#sudo service mongod start
#run-rs --version 4.0.0 --keep --mongod /var/lib/mongodb
run-rs --keep --mongod --dbpath /home/tuti/inkiri/dev/mongodata
#run-rs --shell --keep --mongod --dbpath /home/tuti/inkiri/dev/mongodata
# run-rs --shell --mongod --dbpath /home/tuti/inkiri/dev/mongodata
# mongo --host mongod/localhost:27017,localhost:27018,localhost:27019
# mongo "mongodb://localhost:27017,localhost:27017,localhost:27017/?replicaSet=rs"
sleep 2
npm start