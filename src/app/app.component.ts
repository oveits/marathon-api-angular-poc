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
  intervalTimerMsec = 5000;
  private alive : boolean = true;
  private restURL : String = "http://94.130.187.229/service/marathon/v2/apps";
  restItems : Observable<RestItem[]> = null;
  //restItems : RestItem[] = null;
  restItemsConfigured = null;
  //ticks = 0;
  token = 'eyJhbGciOiJIUzI1NiIsImtpZCI6InNlY3JldCIsInR5cCI6IkpXVCJ9.eyJhdWQiOiIzeUY1VE9TemRsSTQ1UTF4c3B4emVvR0JlOWZOeG05bSIsImVtYWlsIjoib2xpdmVyLnZlaXRzQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJleHAiOjE1MjM5ODk4NTMsImlhdCI6MTUyMzU1Nzg1MywiaXNzIjoiaHR0cHM6Ly9kY29zLmF1dGgwLmNvbS8iLCJzdWIiOiJnb29nbGUtb2F1dGgyfDExNjI1MzMxNzc0ODE4NzQ5MDc3NCIsInVpZCI6Im9saXZlci52ZWl0c0BnbWFpbC5jb20ifQ.NFUW50Gzl78qfI99OPuM6YrxfU4OYLhzWQz7kfoEJPY';

  constructor(private _http: HttpClient) {
  }

  ngOnInit() {
    this.httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json',
        'Authorization': 'token=' + this.token
      })
    };

/*
    let timer = Observable.timer(this.intervalTimerMsec,this.intervalTimerMsec);
    timer.subscribe(t=> {
      this.ticks = t;
      this.updateRestItemsAll();
    });
*/

    TimerObservable.create(0, this.intervalTimerMsec)
      .takeWhile(() => this.alive)
      .subscribe(() => {
        this.getRestItems()
          .subscribe(
                res => { 
                  console.log('getRestItems res:'); 
                  console.log(res.apps); 
                  this.restItems = res.apps; 
                  if (this.restItemsConfigured == null && this.restItems != null) { 
                    this.restItemsConfigured = this.restItems; 
                  }
                  if (this.restItemsConfigured && this.restItems) {
                    this.updateRestItemsAll();
                  }
                  console.log('this.restItems follows:');
                  console.log(this.restItems);
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

/*
  getRestItemsService( namespace : String, serviceName : String ){
    return this._http.get(
      this.restURL + "/" + namespace + '/' + serviceName, this.httpOptions) ;
      //'http://94.130.187.229/service/marathon/v2/apps/mynamespace/nginx-hello-world-service',this.httpOptions) ;
  }
*/

  patchRestItems( body : Object ){
    return this._http.patch<any>(
      this.restURL,
      body,
      this.httpOptions) ;
  }

  setInstances( id : String, instances : Integer ) {
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
        this.setInstances( id, restItemConfigured.instances);
      }
    }
  }


  postRestItemsService(){
    return this._http.post<any>(
      //'http://94.130.187.229/service/marathon/v2/apps/mynamespace/nginx-hello-world-service', 
      'http://http://195.201.30.230:4200/service/marathon/v2/apps/mynamespace/nginx-hello-world-service', 
{
  "id": "/mynamespace/nginx-hello-world-service2",
  "backoffFactor": 1.15,
  "backoffSeconds": 1,
  "container": {
    "portMappings": [
      {
        "containerPort": 80,
        "hostPort": 0,
        "labels": {
          "VIP_0": "/mynamespace/nginx-hello-world-service2:80"
        },
        "protocol": "tcp",
        "servicePort": 80,
        "name": "mynamespace-nginx"
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
  "instances": 3,
  "labels": {
    "HAPROXY_DEPLOYMENT_GROUP": "nginx-hostname2",
    "HAPROXY_0_REDIRECT_TO_HTTPS": "false",
    "HAPROXY_GROUP": "external",
    "HAPROXY_DEPLOYMENT_ALT_PORT": "80",
    "HAPROXY_0_PATH": "/mynamespace/nginx2",
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
this.httpOptions
    )

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
