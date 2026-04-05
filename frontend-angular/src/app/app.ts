import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { environment } from '../environments/environment';
import { interval, Subscription, of } from 'rxjs';
import { startWith, switchMap, catchError } from 'rxjs/operators';

interface Candidate {
  username: string;
  score: number;
  isLoggedIn?: boolean;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App implements OnInit, OnDestroy {
  leaderboard: Candidate[] = [];
  errorMessage: string = '';
  private pollingSubscription?: Subscription;

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    // Poll the backend every 3 seconds for live progress updates
    this.pollingSubscription = interval(3000)
      .pipe(
        startWith(0),
        switchMap(() => 
          this.http.get<any>(`${environment.apiUrl}/leaderboard?t=${new Date().getTime()}`).pipe(
            catchError((err) => {
              this.errorMessage = 'Backend unavailable. Displaying mock data for preview.';
              return of([
                { username: 'Alice Smith', score: 185, isLoggedIn: true },
                { username: 'Bob Johnson', score: 140, isLoggedIn: true },
                { username: 'Charlie Davis', score: 95, isLoggedIn: false },
                { username: 'Diana Prince', score: 45, isLoggedIn: true }
              ]);
            })
          )
        )
      )
      .subscribe({
        next: (response) => {
          console.log('Received data from /api/leaderboard:', response);
          
          // Robustly handle the response format
          let dataArray: Candidate[] = [];
          if (Array.isArray(response)) {
            dataArray = response;
          } else if (response && Array.isArray(response.data)) {
            dataArray = response.data;
          } else if (response && Array.isArray(response.candidates)) {
            dataArray = response.candidates;
          }

          if (dataArray.length > 0) {
            this.leaderboard = dataArray;
            this.errorMessage = '';
          } else {
            // Check if backend actually returned an empty array or if it was a connection failure handled by catchError
            if (this.errorMessage === '') {
              this.leaderboard = [];
              this.errorMessage = 'Waiting for the first candidate to submit code!';
            } else {
              this.leaderboard = [
                { username: 'System Check', score: 0, isLoggedIn: false },
                { username: 'Alice Smith (Sample)', score: 185, isLoggedIn: true },
                { username: 'Bob Johnson (Sample)', score: 140, isLoggedIn: true }
              ];
            }
          }
          
          // Force view update
          this.cdr.detectChanges();
        }
      });
  }

  ngOnDestroy() {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
  }
}
