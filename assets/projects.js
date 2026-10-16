// Generated from projects.json by tools/sync-catalog.py.
window.PROJECT_CATALOG = [
  {
    "name": "Iris Flower Classifier",
    "image": "assets/iris-classifier.webp",
    "technologies": [
      "Python",
      "scikit-learn",
      "Pandas",
      "Model Evaluation"
    ],
    "github": "https://github.com/CodeWithYazzy/projects/tree/main/iris-classifier",
    "localDemo": "iris",
    "status": "Browser demo",
    "category": "Machine learning",
    "description": "A small introduction to classification. Adjust four measurements and explore the bundled Iris model in your browser.",
    "approach": "The included browser model uses fixed StandardScaler and Logistic Regression coefficients.",
    "limitations": "An educational example on a small, clean dataset. Browser probabilities are model outputs, not a performance benchmark.",
    "metrics": [],
    "results": "No performance claim is made here. Inspect the source and reproduce an evaluation for your use case.",
    "featured": true,
    "dataset": "Iris: four measurements and three flower species.",
    "model": "Fixed StandardScaler + Logistic Regression coefficients bundled in this site.",
    "features": "Sepal length, sepal width, petal length, petal width (cm)."
  },
  {
    "name": "Sales Data Dashboard",
    "image": "assets/sales-dashboard.webp",
    "technologies": [
      "Python",
      "Pandas",
      "Matplotlib",
      "EDA"
    ],
    "github": "https://github.com/CodeWithYazzy/projects/tree/main/sales-dashboard",
    "status": "Learning project",
    "category": "Data",
    "description": "A Pandas and Matplotlib exercise that generates and plots 90 days of synthetic sales.",
    "approach": "The source aggregates generated records by day and category.",
    "limitations": "Synthetic data; no real business outcomes or interactive dashboard.",
    "metrics": [],
    "results": "No performance claim is made here. Inspect the source and reproduce an evaluation for your use case.",
    "featured": false
  },
  {
    "name": "PyTorch Image Classifier",
    "image": "assets/pytorch-classifier.webp",
    "technologies": [
      "PyTorch",
      "CNN",
      "Python",
      "Computer Vision"
    ],
    "github": "https://github.com/CodeWithYazzy/projects/tree/main/pytorch-image-classifier",
    "status": "Scaffold",
    "category": "Machine learning",
    "description": "A CNN architecture and CIFAR-10 batch-loading example. Full training and evaluation are still to be built.",
    "approach": "The script loads one batch and checks the model output shape.",
    "limitations": "No training loop, held-out score, or trained checkpoint is included.",
    "metrics": [],
    "results": "No performance claim is made here. Inspect the source and reproduce an evaluation for your use case.",
    "featured": false
  },
  {
    "name": "House Price Predictor",
    "image": "assets/house-price-predictor.webp",
    "technologies": [
      "Python",
      "scikit-learn",
      "Regression",
      "Feature Engineering"
    ],
    "github": "https://github.com/CodeWithYazzy/projects/tree/main/house-price-predictor",
    "status": "Learning project",
    "category": "Machine learning",
    "description": "A regression exercise using generated housing features and a Random Forest pipeline.",
    "approach": "The source creates 200 synthetic rows and evaluates an 80/20 split.",
    "limitations": "Synthetic prices do not establish real housing-market performance.",
    "metrics": [],
    "results": "No performance claim is made here. Inspect the source and reproduce an evaluation for your use case.",
    "featured": false
  },
  {
    "name": "Portfolio Website",
    "image": "assets/portfolio-website.webp",
    "technologies": [
      "HTML",
      "CSS",
      "JavaScript"
    ],
    "github": "https://github.com/CodeWithYazzy/portfolio",
    "status": "Website",
    "category": "Web",
    "description": "The site you are exploring: a personal portfolio, learning laboratory, and independent technology identity.",
    "approach": "Semantic HTML, responsive CSS, and vanilla JavaScript with browser demos.",
    "limitations": "A static site. Contact uses your email app; there is no submission server.",
    "metrics": [],
    "results": "No performance claim is made here. Inspect the source and reproduce an evaluation for your use case.",
    "featured": true,
    "demo": "../index.html"
  },
  {
    "name": "Sentiment Analysis Tool",
    "image": "assets/sentiment-analysis.webp",
    "technologies": [
      "Python",
      "scikit-learn",
      "NLP",
      "Model Evaluation"
    ],
    "github": "https://github.com/CodeWithYazzy/projects/tree/main/sentiment-analysis",
    "status": "Learning project",
    "category": "Machine learning",
    "description": "A TF-IDF and Logistic Regression exercise using six example sentences repeated into a toy dataset.",
    "approach": "The source demonstrates vectorization and a classification report.",
    "limitations": "Repeated sentences cross the split; its score is not evidence of generalization.",
    "metrics": [],
    "results": "No performance claim is made here. Inspect the source and reproduce an evaluation for your use case.",
    "featured": false
  },
  {
    "name": "Numpy Data Explorer",
    "image": "assets/numpy-explorer.webp",
    "technologies": [
      "Numpy",
      "Pandas",
      "Advanced Python"
    ],
    "github": "https://github.com/CodeWithYazzy/projects/tree/main/numpy-explorer",
    "status": "Learning project",
    "category": "Data",
    "description": "Descriptive statistics, correlations, and grouping on a generated NumPy dataset.",
    "approach": "The source creates a seeded 100-row table and prints summary statistics.",
    "limitations": "A synthetic-data exercise, not a general-purpose exploration product.",
    "metrics": [],
    "results": "No performance claim is made here. Inspect the source and reproduce an evaluation for your use case.",
    "featured": false
  },
  {
    "name": "Matplotlib Visualizer",
    "image": "assets/matplotlib-visualizer.webp",
    "technologies": [
      "Matplotlib",
      "Pandas",
      "Python"
    ],
    "github": "https://github.com/CodeWithYazzy/projects/tree/main/matplotlib-visualizer",
    "status": "Learning project",
    "category": "Data",
    "description": "A short Matplotlib script producing line, bar, and scatter plots from sample data.",
    "approach": "The source exports three charts as PNG files.",
    "limitations": "An introductory chart exercise, not an interactive plotting tool.",
    "metrics": [],
    "results": "No performance claim is made here. Inspect the source and reproduce an evaluation for your use case.",
    "featured": false
  },
  {
    "name": "PyTorch Chatbot",
    "image": "assets/pytorch-chatbot.webp",
    "technologies": [
      "PyTorch",
      "NLP",
      "Deep Learning"
    ],
    "github": "https://github.com/CodeWithYazzy/projects/tree/main/pytorch-chatbot",
    "status": "Scaffold",
    "category": "Machine learning",
    "description": "A tiny vocabulary and GRU forward-pass example to explore sequence-model structure.",
    "approach": "The source tokenizes a short input and prints the output tensor shape.",
    "limitations": "No conversational dataset, training loop, or usable chatbot is included.",
    "metrics": [],
    "results": "No performance claim is made here. Inspect the source and reproduce an evaluation for your use case.",
    "featured": false
  },
  {
    "name": "Heart Disease Predictor",
    "image": "assets/heart-disease-predictor.webp",
    "technologies": [
      "Machine Learning",
      "scikit-learn",
      "Pandas"
    ],
    "github": "https://github.com/CodeWithYazzy/projects/tree/main/heart-disease-predictor",
    "status": "Learning project",
    "category": "Machine learning",
    "description": "A classification pipeline using the breast-cancer dataset, despite the original folder name.",
    "approach": "The source uses scikit-learn load_breast_cancer and a Random Forest.",
    "limitations": "This is not a heart-disease model, a clinical tool, or medical advice.",
    "metrics": [],
    "results": "No performance claim is made here. Inspect the source and reproduce an evaluation for your use case.",
    "featured": false
  },
  {
    "name": "Customer Segmentation",
    "image": "assets/customer-segmentation.webp",
    "technologies": [
      "Python",
      "scikit-learn",
      "Clustering"
    ],
    "github": "https://github.com/CodeWithYazzy/projects/tree/main/customer-segmentation",
    "status": "Learning project",
    "category": "Machine learning",
    "description": "A K-Means exercise grouping synthetic customer spending and visit counts.",
    "approach": "The source scales generated data and prints the means of three clusters.",
    "limitations": "Synthetic customer data; no validated commercial segmentation.",
    "metrics": [],
    "results": "No performance claim is made here. Inspect the source and reproduce an evaluation for your use case.",
    "featured": false
  },
  {
    "name": "Handwritten Digit Classifier",
    "image": "assets/digit-classifier.webp",
    "technologies": [
      "PyTorch",
      "CNN",
      "Python",
      "Computer Vision"
    ],
    "github": "https://github.com/CodeWithYazzy/projects/tree/main/handwritten-digit-classifier",
    "status": "Scaffold",
    "category": "Machine learning",
    "description": "A PyTorch CNN architecture for 28\u00d728 grayscale inputs and ten output classes.",
    "approach": "The repository defines a DigitCNN model class.",
    "limitations": "No dataset loading, trained weights, training loop, or test score is included.",
    "metrics": [],
    "results": "No performance claim is made here. Inspect the source and reproduce an evaluation for your use case.",
    "featured": false
  },
  {
    "name": "Stock Price Predictor",
    "image": "assets/stock-predictor.webp",
    "technologies": [
      "Python",
      "Pandas",
      "Time Series"
    ],
    "github": "https://github.com/CodeWithYazzy/projects/tree/main/stock-predictor",
    "status": "Learning project",
    "category": "Data",
    "description": "A linear-regression baseline on a generated price-like series, using a time-based split.",
    "approach": "The source predicts from a previous-value feature on synthetic data.",
    "limitations": "Not market data or a validated financial forecasting tool.",
    "metrics": [],
    "results": "No performance claim is made here. Inspect the source and reproduce an evaluation for your use case.",
    "featured": false
  },
  {
    "name": "AI Assistant",
    "image": "assets/ai-assistant.webp",
    "technologies": [
      "Python",
      "LLMs",
      "RAG",
      "Deep Learning"
    ],
    "github": "https://github.com/CodeWithYazzy/projects/tree/main/ai-assistant",
    "status": "Scaffold",
    "category": "Machine learning",
    "description": "A small retrieval sketch using hash-based distances between three example strings.",
    "approach": "The source ranks hard-coded strings with an MD5-derived number.",
    "limitations": "No semantic embeddings, language model, or answer generation is included.",
    "metrics": [],
    "results": "No performance claim is made here. Inspect the source and reproduce an evaluation for your use case.",
    "featured": false
  },
  {
    "name": "Calculator App",
    "image": "assets/calculator-app.webp",
    "technologies": [
      "JavaScript",
      "HTML",
      "CSS"
    ],
    "github": "https://github.com/CodeWithYazzy/projects/tree/main/calculator-app",
    "localDemo": "calculator",
    "status": "Browser demo",
    "category": "Web",
    "description": "A working browser calculator with operator precedence and clear error feedback.",
    "approach": "The browser uses a recursive-descent parser without eval or a required backend.",
    "limitations": "The browser preview is separate from the linked Python desktop calculator.",
    "metrics": [],
    "results": "No performance claim is made here. Inspect the source and reproduce an evaluation for your use case.",
    "featured": true
  }
];
