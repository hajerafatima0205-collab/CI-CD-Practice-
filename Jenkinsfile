pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Set Up') {
      steps {
        bat 'python -m pip install --upgrade pip'
        bat 'python -m pip install -r requirements.txt'
      }
    }

    stage('Verify') {
      steps {
        bat 'python -m py_compile app.py'
        bat 'python -c "from app import app; print(app.url_map)"'
      }
    }
  }

  post {
    always {
      echo 'Pipeline finished.'
    }
  }
}
