import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { TimerObservable } from "rxjs/observable/TimerObservable";
import { Observable } from 'rxjs/Rx';
import 'rxjs/add/operator/takeWhile';
import { catchError, map, tap } from 'rxjs/operators';
//import { isArray } from '@angular/facade/lang';
// not tested:
//import 'rxjs/add/operator/retry';

  interface App {
    id: String;
    deployments: String;
    configuredInstances: String;
    tasksStaged: String;
    tasksHealthy: String;
    tasksUnhealthy: String;
    tasksRunning: String;
  }

  interface Apps {
    apps: App[];
  }


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  httpOptions = null;
  viewRefreshIntervalTimerMsec = 5000;
  syncIntervalTimerMsec = 5000;
  intervalTimerMsec = 5000;
  private alive : boolean = true;
  private restURL : string = "http://94.130.187.229/service/marathon/v2/apps";
  restItems = [];
  restItemsConfigured = [];
  updateAlways=true;
  token = 'eyJhbGciOiJIUzI1NiIsImtpZCI6InNlY3JldCIsInR5cCI6IkpXVCJ9.eyJhdWQiOiIzeUY1VE9TemRsSTQ1UTF4c3B4emVvR0JlOWZOeG05bSIsImVtYWlsIjoib2xpdmVyLnZlaXRzQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJleHAiOjE1MjU4MDcxNjAsImlhdCI6MTUyNTM3NTE2MCwiaXNzIjoiaHR0cHM6Ly9kY29zLmF1dGgwLmNvbS8iLCJzdWIiOiJnb29nbGUtb2F1dGgyfDExNjI1MzMxNzc0ODE4NzQ5MDc3NCIsInVpZCI6Im9saXZlci52ZWl0c0BnbWFpbC5jb20ifQ.ghi5W7id3MvGj92rNlP9LsZtTd91RIcZXosl_zxVvjo';
  //token = 'eyJhbGciOiJIUzI1NiIsImtpZCI6InNlY3JldCIsInR5cCI6IkpXVCJ9.eyJhdWQiOiIzeUY1VE9TemRsSTQ1UTF4c3B4emVvR0JlOWZOeG05bSIsImVtYWlsIjoib2xpdmVyLnZlaXRzQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJleHAiOjE1MjQ0MzExMjksImlhdCI6MTUyMzk5OTEyOSwiaXNzIjoiaHR0cHM6Ly9kY29zLmF1dGgwLmNvbS8iLCJzdWIiOiJnb29nbGUtb2F1dGgyfDExNjI1MzMxNzc0ODE4NzQ5MDc3NCIsInVpZCI6Im9saXZlci52ZWl0c0BnbWFpbC5jb20ifQ.vPd4YMQ4GFWaDeEYgaALBLKBJUFeGF6KzFIkgdMl_g0';

  constructor(private _http: HttpClient) {
  }

  ngOnInit() {
    this.httpOptions = {
      //observe: 'body',
      headers: new HttpHeaders({
        'Content-Type':  'application/json',
        'Authorization': 'token=' + this.token
      })
    };

    /* Provision Timer
     *   provision the target system by sending REST requests
     */ 
    Observable.timer(this.syncIntervalTimerMsec,this.syncIntervalTimerMsec)
      .takeWhile(() => this.alive)
      .subscribe(t=> {
        // Provision the target system, if the list of configured items does not match the list of discovered items:
        if (this.restItemsConfigured && this.restItems && this.updateAlways) {
          this.updateRestItemsAll();
        }
      });

    /* Page refresh and Syncback Timer
     *
     */
    TimerObservable.create(0, this.viewRefreshIntervalTimerMsec)
      .takeWhile(() => this.alive)
      .subscribe(() => {
        this.getRestItems()
          .subscribe(
                res => { 
                  console.log('getRestItems res:'); 
    //this.createItem("/hello", 1);
                  console.log(res); 
                  console.log(res['apps']); 
                  //console.log(res.apps);

                  // update discovered items list:
                  this.restItems = res['apps'].sort(this.compareById);

                  // add new discoverd items to the list of configured items:
                  this.synchronize_a_to_b(this.restItems, this.restItemsConfigured);
 
                  // provision new items and perform garbage collection (clean deleted items)
                  this.provision_a_to_b(this.restItemsConfigured, this.restItems);
/*
*/

            },
            err => {
              console.log("Error occured");
            }
          );
      });
    

  } // end ngOnInit()

  ngOnDestroy(){
    this.alive = false;
  }

  /*
   * createItem: creates a item in the restItemsConfigured list
   * 
   * Parameters
   * - id : String
   *
   */
  createItem(id : String, instances : String){
    if(!id){ return("createItem called with no id; returning");}
    if(!instances){ instances = "1";}
    let found = this.restItemsConfigured.find(function (item) { return item.id === id; });
    if(typeof found === "undefined"){
      this.restItemsConfigured.push({"id": id, "instances": instances});
      this.restItemsConfigured = this.restItemsConfigured.sort(this.compareById);
    } else {
      return("cannot create item; id exists already");
    }
  }

  synchronize_a_to_b(a,b){

    /*
     *  Synchronize discovered items of a to the array b
     *    loop through the items of a
     *    append each discovered item to the list b; if not already present
     *    sort b by IDs
     */
    let changed = false;
    for(let aItem of a){
      let found = null;
      if(b) {
        let found = b.find(function (bItem) { return bItem.id === aItem.id; })
      }
      if(!found){
        b.push(aItem);
        console.log('Discovered new item ' + aItem.id + '; now synchronized');
        changed = true;
      }
    }
    if(changed) {b = b.sort(this.compareById);}
  }

  provision_a_to_b(a,b){
    /* 
     * provision missing items on target system:
     * - if an item is found in the local configured items list, 
     *   but it is not present on the target system, then provision it (e.g. via REST PUT or POST command)
     * delete obsolete configuration items locally:
     * - if an item is marked as deleted and is found to be missing on the target, then it will be removed
     */
    let changed = false;
    for(let aItem of a){
      let found = null;
      if(b) {
        let found = b.find(function (bItem) { return bItem.id === aItem.id; })
      }
      if(!found){
        if(aItem.instances == -1){  
          // TODO: in future, let us define aItem to be of class ProvisioningElement and let us 
          //       define an element or function provisioningElement.isDeleted() that we can use as follows:
          //       if(aItem.isDeleted()){ ... }
          // remove aItem from a
          var index = a.indexOf(aItem);
          if(index > -1){
            a.splice(index, 1);
          }
        } else {
          // provision item
        }
        //b.push(aItem);
        //console.log('Discovered new item ' + aItem.id + '; now synchronized');
        //changed = true;
      }
    }
    //if(changed) {b = b.sort(this.compareById);}
  }
/*
  // synchronize_b_to_a -- clean configured list from unneeded deleted items
  synchronize_b_to_a(a,b){
    // find items in a that are to_be_deleted and that are deleted on b and remove them
    let changed = false;
    to_be_deleted(item){
       if( item.instances == -1 ){
         return item;
       } else { 
         return null;
    }
    for(let aItem of a){
      if(b) {
        let found = b.find(function (bItem) { return bItem.id === aItem.id; })
      }
      if(!found){
        b.push(aItem);
        console.log('Discovered new item ' + aItem.id + '; now synchronized');
        changed = true;
      }
    }
    if(changed) {b = b.sort(this.compareById);}
  }
*/

  compareById(app1, app2){
    if (app1.id < app2.id) {
      return -1;
    }
    if (app1.id > app2.id) {
      return 1;
    }
    return 0;
  }

  findRestItemById( id : String ){
      let found = this.restItems.find(function (item) { return item.id === id; });
      if(typeof found === "undefined"){
        return [];
      } else {
        return [found];
      }
  }

/*
  getRestItemsWithPipe(): Apps{
    return this._http.get<RestItem[]>(this.restURL + "/", this.httpOptions)
      .pipe(
        tap()
        //map(res => this.myRestItems = res),
        //tap(apps => this.log('fetched apps')) //,
        //tap(apps => this.restItems = apps; ),
        //catchError(this.handleError('getRestItems', []))
      );
  }
*/

/*
  getRestItems(): Observable<any[]>{
    return this._http.get<any[]>(this.restURL + "/", this.httpOptions);
  }
*/
  getRestItems<Apps>(){
    return this._http.get<Apps>(this.restURL + "/", this.httpOptions);
  }

  patchRestItems( body : Object ){
    return this._http.patch<any>(
      this.restURL,
      body,
      this.httpOptions) ;
  }

  patchInstances( id : String, instances ) {

    if( instances < 0){ return -1; }
    var body = [{"id": id,"instances": instances}];
    this.patchRestItems( body )
// not tested:
//.retry(3)
      .subscribe(
        res => {
          console.log(res);
        },
        err => {
          console.log("Error occured");
        }
      );
  }

  updateRestItemsAll() {
              console.log('this');
              console.log(this);
    //if(this && this.restItemsConfigured){
    if(this
       && this.restItemsConfigured 
       && Array.isArray(this.restItemsConfigured)){
      for(let index in this.restItemsConfigured){
         console.log(index);
         console.log(this.restItemsConfigured[index]);
         this.updateInstances( this.restItemsConfigured[index].id );
      }
    } // end if(this.restItemsConfigured != null)
  } // end updateRestItemsAll()

  updateInstances( id : String ) {
    console.log(this.restItems);

    // if restItemsConfigured is null, we 
    if( ! this.restItemsConfigured ) { return null; }
    if( this.restItemsConfigured.length == 0 ) { return null; }
    let restItemConfigured = this.restItemsConfigured.find(
          function (restItemConfigured) { return restItemConfigured.id === id; });
    if( ! restItemConfigured ) { return null; }

    if( this.restItems ){
      let restItem = this.restItems.find(function (item) { return item.id === id; });
    }

    // delete item
    //if( restItemConfigured.instances == -1 && restItem ) {
    if( restItemConfigured.instances == -1 ) {
/*
      if ( restItem ){
        return this.deleteRestItem(id);
      }
*/
      if( this.restItems.find(function (item) { return item.id === id; }) ){
        return this.deleteRestItem(id);
      }
    }

    // update item
    if( this.restItems != null ){
      var restItem = this.restItems.find(function (item) { return item.id === id; });
      if( restItem == null && restItemConfigured.instances == -1){
        // TODO: remove element from this.restItemsConfigured array
      }
      console.log(restItem);
      console.log(restItemConfigured);
      if( ! restItem) {
        this.putRestItems(restItemConfigured.id);
      }
      if( restItem && restItemConfigured.instances >= 0 && restItem.instances != restItemConfigured.instances ){
        this.patchInstances( id, restItemConfigured.instances);
      }
    }
  }

  putRestItems( id : String ){
    return this.putRestItemsService(id)
      .subscribe(
        res => {
          console.log(res);
        },
        err => {
          console.log("Error occured");
        }
      );
  }
      

  putRestItemsService( id : String ){
    console.log("putRestItemsService(id = " + id + ")");
    return this._http.put<any>(this.restURL + "/" + id,
{
  "id": id,
  "backoffFactor": 1.15,
  "backoffSeconds": 1,
  "container": {
    "portMappings": [
      {
        "containerPort": 80,
        "hostPort": 0,
        "labels": {
        },
        "protocol": "tcp",
        "servicePort": 80
      }
    ],
    "type": "DOCKER",
    "volumes": [],
    "docker": {
      "image": "nginxdemos/hello",
      "forcePullImage": false,
      "privileged": false,
      "parameters": []
    }
  },
  "cpus": 0.1,
  "disk": 0,
  "healthChecks": [
    {
      "gracePeriodSeconds": 15,
      "ignoreHttp1xx": false,
      "intervalSeconds": 3,
      "maxConsecutiveFailures": 2,
      "portIndex": 0,
      "timeoutSeconds": 2,
      "delaySeconds": 15,
      "protocol": "HTTP",
      "path": "/"
    }
  ],
  "instances": 1,
  "labels": {
    "HAPROXY_DEPLOYMENT_GROUP": "nginx-hostname",
    "HAPROXY_0_REDIRECT_TO_HTTPS": "false",
    "HAPROXY_GROUP": "external",
    "HAPROXY_DEPLOYMENT_ALT_PORT": "80",
    "HAPROXY_0_PATH": id,
    "HAPROXY_0_VHOST": "195.201.17.1"
  },
  "maxLaunchDelaySeconds": 3600,
  "mem": 100,
  "gpus": 0,
  "networks": [
    {
      "mode": "container/bridge"
    }
  ],
  "requirePorts": false,
  "upgradeStrategy": {
    "maximumOverCapacity": 1,
    "minimumHealthCapacity": 1
  },
  "killSelection": "YOUNGEST_FIRST",
  "unreachableStrategy": {
    "inactiveAfterSeconds": 0,
    "expungeAfterSeconds": 0
  },
  "fetch": [],
  "constraints": []
}
,
this.httpOptions);
  }

  deleteRestItem( id : String ){
    return this.deleteRestItemService(id)
      .subscribe(
        res => {
          console.log(res);
        },
        err => {
          console.log("Error occured");
        }
      );
  }
 
  deleteRestItemService( id : String ){
    console.log("deleteRestItemsService(id = " + id + ")");
    return this._http.delete<any>(this.restURL + "/" + id,this.httpOptions);
  }


}
