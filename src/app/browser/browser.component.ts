import { Component, OnInit } from '@angular/core';
import { DeviceDetectorService } from 'ngx-device-detector';

@Component({
  selector: 'app-browser',
  templateUrl: './browser.component.html'
})
export class BrowserComponent implements OnInit {
  browser;
  constructor(
    private deviceService: DeviceDetectorService) { }

  ngOnInit() {
    this.browser = this.deviceService.browser;
  }

}
