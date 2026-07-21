import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SharedService {

  constructor() { }
  private readonly eventSubject = new Subject<any>();

  sendEvent(data: any) {
    this.eventSubject.next(data);
  }

  getEvent() {
    return this.eventSubject.asObservable();
  }
}


