
import { Routes } from '@angular/router';

import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { DashboardLayoutComponent } from './layout/dashboard-layout/dashboard-layout.component';

import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { UploadComponent } from './pages/upload/upload.component';
import { DownloadComponent } from './pages/download/download.component';
import { HistoryComponent } from './pages/history/history.component';

import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: '',
        component: HomeComponent,
        title: 'DataShare'
      },
      {
        path: 'login',
        component: LoginComponent,
        title: 'Connexion — DataShare'
      },
      {
        path: 'register',
        component: RegisterComponent,
        title: 'Créer un compte — DataShare'
      },
      {
        path: 'upload',
        component: UploadComponent,
        canActivate: [authGuard],
        title: 'Téléverser — DataShare'
      },
      {
        path: 'download/:token',
        component: DownloadComponent,
        title: 'Télécharger — DataShare'
      }
    ]
  },

  {
    path: '',
    component: DashboardLayoutComponent,
    canActivateChild: [authGuard],
    children: [
      {
        path: 'history',
        component: HistoryComponent,
        title: 'Historique — DataShare'
      }
    ]
  },

  {
    path: '**',
    redirectTo: ''
  }

];
