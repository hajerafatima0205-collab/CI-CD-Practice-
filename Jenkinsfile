pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
  }

  stages {
    stage('Checkout') {
      steps {
        sh 'git clone $REPO_URL'
      }
    }

    stage('Set Up') {
      steps {
        sh 'python -m pip install --upgrade pip'
        sh 'python -m pip install -r requirements.txt'
      }
    }

    stage('Verify') {
      steps {
        sh 'python -m py_compile app.py'
        sh 'python -c "from app import app; print(app.url_map)"'
      }
    }
  }

  post {
    always {
      echo 'Pipeline finished.'
    }
  }
}
