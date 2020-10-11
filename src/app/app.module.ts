import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AngularFireModule } from '@angular/fire';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { AngularFireStorageModule } from '@angular/fire/storage';
import { AngularFireAuthModule } from '@angular/fire/auth';
import {MatButtonModule} from '@angular/material/button';
import { FlexLayoutModule } from '@angular/flex-layout';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatProgressBarModule} from '@angular/material/progress-bar';
const config = {
  apiKey: "AIzaSyD02vvVRtO95RVKbfhx49fKZI9SzQRqy7M",
  authDomain: "jeniapp-f7c47.firebaseapp.com",
  databaseURL: "https://jeniapp-f7c47.firebaseio.com",
  projectId: "jeniapp-f7c47",
  storageBucket: "jeniapp-f7c47.appspot.com",
  messagingSenderId: "207310949849",
  appId: "1:207310949849:web:c1fb89a692357f62ef5dc8"
};

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    BrowserAnimationsModule,
    AngularFireModule.initializeApp(config),
    AngularFirestoreModule, // firestore
    AngularFireAuthModule, // auth
    AngularFireStorageModule, // storage
    MatButtonModule,
    FlexLayoutModule,
    MatToolbarModule,
    MatProgressBarModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
