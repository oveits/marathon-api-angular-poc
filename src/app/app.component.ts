import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { TimerObservable } from "rxjs/observable/TimerObservable";
import 'rxjs/add/operator/takeWhile';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  app = 'myapp';
  app_id = 'unknown';
  deployments = 'unknown';
  tasksStaged = 'unknown';
  tasksHealthy = 'unknown';
  tasksUnhealthy = 'unknown';
  tasksRunning = 'unknown';
  httpOptions = null;
  intervalTimerMsec = 2500;
  private alive: boolean = true;

  constructor(private _http: HttpClient) {
  }

  ngOnInit() {
    this.httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json',
        'Authorization': 'token=eyJhbGciOiJIUzI1NiIsImtpZCI6InNlY3JldCIsInR5cCI6IkpXVCJ9.eyJhdWQiOiIzeUY1VE9TemRsSTQ1UTF4c3B4emVvR0JlOWZOeG05bSIsImVtYWlsIjoib2xpdmVyLnZlaXRzQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJleHAiOjE1MjM1NTM0ODQsImlhdCI6MTUyMzEyMTQ4NCwiaXNzIjoiaHR0cHM6Ly9kY29zLmF1dGgwLmNvbS8iLCJzdWIiOiJnb29nbGUtb2F1dGgyfDExNjI1MzMxNzc0ODE4NzQ5MDc3NCIsInVpZCI6Im9saXZlci52ZWl0c0BnbWFpbC5jb20ifQ.0mM9qaNenUgUnT3NZS71_9reLTojKRdGaqRzTOO-X4I'
      })
    };


    TimerObservable.create(0, this.intervalTimerMsec)
      .takeWhile(() => this.alive)
      .subscribe(() => {
        this.getMarathonAppsService()
          .subscribe(
            res => {
              this.app_id = res.app.id;
              this.deployments = res.app.deployments.length;
              this.tasksStaged = res.app.tasksStaged;
              this.tasksRunning = res.app.tasksRunning;
              this.tasksHealthy = res.app.tasksHealthy;
              this.tasksUnhealthy = res.app.tasksUnhealthy;
              console.log(this.app_id);
              console.log(this.deployments);
              console.log(this.tasksRunning);
              console.log(this.tasksHealthy);
              console.log(res);
            },
            err => {
              console.log("Error occured");
            }
          );
      });
  }

  ngOnDestroy(){
    this.alive = false;
  }

  getMarathonAppsService(){
    return this._http.get<any>(
      'http://94.130.187.229/service/marathon/v2/apps/mynamespace/nginx-hello-world-service',this.httpOptions) ;
  }

  setInstances( runningInstances : Integer ) {
   this._http.patch<any>(
      'http://94.130.187.229/service/marathon/v2/apps', 
      [{"id": "/mynamespace/nginx-hello-world-service","instances": runningInstances}], this.httpOptions)
      .subscribe(
        res => {
          console.log(res);
        },
        err => {
          console.log("Error occured");
        }
      );
  }

 
  jsonplaceholderPost() {
    this._http.post('http://jsonplaceholder.typicode.com/posts', {
      title: 'foo',
      body: 'bar',
      userId: 1
    }, this.httpOptions)
      .subscribe(
        res => {
          console.log(res);
          //console.log(this.httpOptions);
        },
        err => {
          console.log("Error occured");
        }
      );
  }



  postMarathonAppsService(){
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

}
