import { Component, Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Utilities {
  constructor(private db: AngularFirestore) {}

  /**
   * Converts a Firebase timestamp to a Date object
   * @param timestamp Firebase timestamp
   * @returns `Date` object
   */
  timestampToDate(timestamp: any): Date {
    if (timestamp === undefined || timestamp === null || timestamp.seconds === undefined) {
      console.log('utilities.ts: timestampToDate(): ', 'datum je undefined i bice 01.01.1970.');
      return new Date(0);
    }
    try {
      // console.log('datum ime timestamp');
      return new Date(timestamp.seconds * 1000);
    } catch {
      console.log('timestamp catch', timestamp);
      return new Date(0);
    }
  }
}
