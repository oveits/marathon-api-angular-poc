import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { TimerObservable } from "rxjs/observable/TimerObservable";
import { Observable } from 'rxjs/Rx';
import 'rxjs/add/operator/takeWhile';
import { catchError, map, tap } from 'rxjs/operators';
import { isArray } from '@angular/facade/lang';
// not tested:
//import 'rxjs/add/operator/retry';


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
  private restURL : String = "http://94.130.187.229/service/marathon/v2/apps";
  restItems : Observable<RestItem[]> = [];
  restItemsConfigured : Observable<RestItem[]> = [];
  updateAlways=true;
  token = 'eyJhbGciOiJIUzI1NiIsImtpZCI6InNlY3JldCIsInR5cCI6IkpXVCJ9.eyJhdWQiOiIzeUY1VE9TemRsSTQ1UTF4c3B4emVvR0JlOWZOeG05bSIsImVtYWlsIjoib2xpdmVyLnZlaXRzQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJleHAiOjE1MjQ0MzExMjksImlhdCI6MTUyMzk5OTEyOSwiaXNzIjoiaHR0cHM6Ly9kY29zLmF1dGgwLmNvbS8iLCJzdWIiOiJnb29nbGUtb2F1dGgyfDExNjI1MzMxNzc0ODE4NzQ5MDc3NCIsInVpZCI6Im9saXZlci52ZWl0c0BnbWFpbC5jb20ifQ.vPd4YMQ4GFWaDeEYgaALBLKBJUFeGF6KzFIkgdMl_g0';
  //token = 'eyJhbGciOiJIUzI1NiIsImtpZCI6InNlY3JldCIsInR5cCI6IkpXVCJ9.eyJhdWQiOiIzeUY1VE9TemRsSTQ1UTF4c3B4emVvR0JlOWZOeG05bSIsImVtYWlsIjoib2xpdmVyLnZlaXRzQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJleHAiOjE1MjM5ODk4NTMsImlhdCI6MTUyMzU1Nzg1MywiaXNzIjoiaHR0cHM6Ly9kY29zLmF1dGgwLmNvbS8iLCJzdWIiOiJnb29nbGUtb2F1dGgyfDExNjI1MzMxNzc0ODE4NzQ5MDc3NCIsInVpZCI6Im9saXZlci52ZWl0c0BnbWFpbC5jb20ifQ.NFUW50Gzl78qfI99OPuM6YrxfU4OYLhzWQz7kfoEJPY';

  constructor(private _http: HttpClient) {
  }

  ngOnInit() {
    this.httpOptions = {
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
                  console.log(res.apps); 

                  // update discovered items list:
                  this.restItems = res.apps.sort(this.compareById);

                  // add new discoverd items to the list of configured items:
                  this.synchronize_a_to_b(this.restItems, this.restItemsConfigured);

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

  synchronize_a_to_b(a,b){

    /*
     *  Synchronize discovered itmes of a to the array b
     *    loop through the items of a
     *    append each discovered item to the list b; if not already present
     *    sort b by IDs
     */
    let changed = false;
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

  compareById(app1, app2){
    if (app1.id < app2.id) {
      return -1;
    }
    if (app.id > app2.id) {
      return 1;
    }
    return 0;
  }

  findRestItemById( id : String ){
      return this.restItems.find(function (item) { return item.id === id; });
  }

  getRestItemsWithPipe(): Observable<RestItem[]>{
    return this._http.get<RestItem[]>(this.restURL + "/", this.httpOptions)
      .pipe(
        tap(),
        //map(res => this.myRestItems = res),
        //tap(apps => this.log('fetched apps')) //,
        //tap(apps => this.restItems = apps; ),
        //catchError(this.handleError('getRestItems', [])
       )
      );
  }

  getRestItems(): Observable<RestItem[]>{
    return this._http.get<RestItem[]>(this.restURL + "/", this.httpOptions);
  }

  patchRestItems( body : Object ){
    return this._http.patch<any>(
      this.restURL,
      body,
      this.httpOptions) ;
  }

  patchInstances( id : String, instances : Integer ) {
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
    if( this.restItems != null ){
      var restItem = this.restItems.find(function (item) { return item.id === id; });
      console.log(restItem);
      var restItemConfigured = this.restItemsConfigured.find(function (restItemConfigured) { return restItemConfigured.id === id; });
      console.log(restItemConfigured);
      if( restItem.instances != restItemConfigured.instances ){
        this.patchInstances( id, restItemConfigured.instances);
      }
    }
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
  "instances": this.findRestItemById(id) ? this.findRestItemById(id).instances : 1,
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
this.httpOptions)
      .subscribe(
        res => {
          console.log(res);
        },
        err => {
          console.log("Error occured");
        }
      );

  }

  interface App {
    id: String;
    deployments: String;
    configuredInstances: String;
    tasksStaged: String;
    tasksHealthy: String;
    tasksUnhealthy: String;
    tasksRunning: String;
  }


}
