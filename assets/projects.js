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
    "status": "Interactive demo",
    "category": "Machine learning",
    "description": "A four-input classifier that runs entirely in the browser. Move the measurements and the model picks a species.",
    "approach": "Fixed StandardScaler and logistic-regression coefficients run in JavaScript. No model server.",
    "limitations": "An educational example on a small, clean dataset. The percentages show model output, not measured accuracy.",
    "metrics": [],
    "results": "A live prediction for three Iris species. No performance benchmark is claimed.",
    "featured": true,
    "dataset": "Iris: four measurements and three flower species.",
    "model": "Fixed StandardScaler + logistic-regression coefficients bundled in this site.",
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
    "description": "Ninety days of synthetic sales, grouped by day and category, then plotted with Pandas and Matplotlib.",
    "approach": "The script generates records, aggregates them, and exports charts.",
    "limitations": "Synthetic data, not a real business dashboard. There is no live data source.",
    "metrics": [],
    "results": "Summary tables and static charts generated from the sample.",
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
    "status": "In progress",
    "category": "Machine learning",
    "description": "A CNN architecture and CIFAR-10 loader, built to understand how an image classifier is put together.",
    "approach": "Loads one CIFAR-10 batch and checks the model's output shape.",
    "limitations": "No training loop, trained weights, or held-out score yet.",
    "metrics": [],
    "results": "Architecture and a forward pass. Training is in progress.",
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
    "description": "A regression exercise on generated housing data, using a scikit-learn Random Forest pipeline.",
    "approach": "Creates 200 synthetic rows and evaluates an 80/20 split.",
    "limitations": "Synthetic prices do not reflect a real housing market.",
    "metrics": [],
    "results": "A working pipeline and a local evaluation on generated data.",
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
    "description": "The site you're reading: a hand-written portfolio with two working browser demos and a full project index.",
    "approach": "Semantic HTML, CSS, and vanilla JavaScript. No framework or build step.",
    "limitations": "A static site. Contact opens your email app; nothing is stored.",
    "metrics": [],
    "results": "This website.",
    "featured": false,
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
    "description": "A TF-IDF and logistic-regression exercise on six example sentences, built to see the full text-classification loop.",
    "approach": "Vectorizes the sentences and prints a classification report.",
    "limitations": "The same sentences appear in training and test splits, so the score is not evidence of generalization.",
    "metrics": [],
    "results": "A short end-to-end example, not a validated sentiment model.",
    "featured": false
  },
  {
    "name": "NumPy Data Explorer",
    "image": "assets/numpy-explorer.webp",
    "technologies": [
      "NumPy",
      "Pandas",
      "Advanced Python"
    ],
    "github": "https://github.com/CodeWithYazzy/projects/tree/main/numpy-explorer",
    "status": "Learning project",
    "category": "Data",
    "description": "Descriptive statistics, correlations, and grouping on a generated NumPy table.",
    "approach": "Creates a seeded 100-row dataset and prints summary statistics.",
    "limitations": "A synthetic-data exercise, not a general-purpose analysis tool.",
    "metrics": [],
    "results": "Console summaries of the generated data.",
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
    "description": "A short Matplotlib exercise that turns sample data into line, bar, and scatter plots.",
    "approach": "Exports three charts as PNG files.",
    "limitations": "An introductory plotting exercise, not an interactive tool.",
    "metrics": [],
    "results": "Three static chart files.",
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
    "status": "In progress",
    "category": "Machine learning",
    "description": "A tiny GRU forward pass built to understand the shape of a sequence model.",
    "approach": "Tokenizes a short input and prints the output tensor shape.",
    "limitations": "No conversation dataset, training loop, or working chatbot.",
    "metrics": [],
    "results": "A model skeleton with a verified forward pass.",
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
    "description": "A scikit-learn classification pipeline trained on the breast-cancer dataset, built while learning pipelines.",
    "approach": "Loads scikit-learn's breast-cancer data and fits a Random Forest.",
    "limitations": "The folder name says heart disease, but this is a breast-cancer classifier. It is not a clinical tool or medical advice.",
    "metrics": [],
    "results": "A local pipeline and evaluation on a standard teaching dataset.",
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
    "description": "A K-Means exercise that groups synthetic customer spending and visit counts into three clusters.",
    "approach": "Scales generated data and prints the means of each cluster.",
    "limitations": "Synthetic customer data. The clusters are an exercise, not a commercial segmentation.",
    "metrics": [],
    "results": "Three cluster summaries.",
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
    "status": "In progress",
    "category": "Machine learning",
    "description": "A PyTorch CNN architecture for 28\u00c3\u201428 grayscale digits and ten output classes.",
    "approach": "Defines the model class and its layer shapes.",
    "limitations": "No dataset loading, training loop, trained weights, or test score.",
    "metrics": [],
    "results": "An architecture sketch.",
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
    "description": "A linear-regression baseline on a generated price series, using a time-based split.",
    "approach": "Predicts from a previous-value feature on synthetic data.",
    "limitations": "Not market data, and not a validated financial forecasting tool.",
    "metrics": [],
    "results": "A baseline and an evaluation on generated prices.",
    "featured": false
  },
  {
    "name": "AI Assistant",
    "image": "assets/ai-assistant.webp",
    "technologies": [
      "Python",
      "Retrieval"
    ],
    "github": "https://github.com/CodeWithYazzy/projects/tree/main/ai-assistant",
    "status": "In progress",
    "category": "Machine learning",
    "description": "A small retrieval sketch that ranks three hard-coded strings by hash distance.",
    "approach": "Uses an MD5-derived number as a distance between strings.",
    "limitations": "No semantic embeddings, language model, or answer generation. It is not a working assistant.",
    "metrics": [],
    "results": "A retrieval sketch, not an assistant.",
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
    "status": "Interactive demo",
    "category": "Web",
    "description": "A working browser calculator with operator precedence, keyboard support, and clear error states.",
    "approach": "A recursive-descent parser in JavaScript. No eval and no backend.",
    "limitations": "The browser demo is separate from the linked Python desktop calculator.",
    "metrics": [],
    "results": "A usable calculator with tested arithmetic and divide-by-zero handling.",
    "featured": true
  }
];
