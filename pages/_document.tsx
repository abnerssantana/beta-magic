import Document, { Html, Head, Main, NextScript } from 'next/document';

class MyDocument extends Document {
  render() {
    return (
      <Html lang="pt-BR">
        <Head>
          <meta charSet="UTF-8" />

          {/* Apple Touch Icons */}
          <link rel="apple-touch-icon" sizes="57x57" href="/inc/apple-icon-57x57.png" />
          <link rel="apple-touch-icon" sizes="60x60" href="/inc/apple-icon-60x60.png" />
          <link rel="apple-touch-icon" sizes="72x72" href="/inc/apple-icon-72x72.png" />
          <link rel="apple-touch-icon" sizes="76x76" href="/inc/apple-icon-76x76.png" />
          <link rel="apple-touch-icon" sizes="114x114" href="/inc/apple-icon-114x114.png" />
          <link rel="apple-touch-icon" sizes="120x120" href="/inc/apple-icon-120x120.png" />
          <link rel="apple-touch-icon" sizes="144x144" href="/inc/apple-icon-144x144.png" />
          <link rel="apple-touch-icon" sizes="152x152" href="/inc/apple-icon-152x152.png" />
          <link rel="apple-touch-icon" sizes="180x180" href="/inc/apple-icon-180x180.png" />

          {/* Favicon Icons */}
          <link rel="icon" type="image/png" sizes="192x192" href="/logoDark.png" />
          <link rel="icon" type="image/png" sizes="96x96" href="/logoDark.png" />
          <link rel="icon" type="image/png" sizes="32x32" href="/logoDark.png" />
          <link rel="icon" type="image/png" sizes="16x16" href="/logoDark.png" />
          <link rel="manifest" href="/manifest.json" />

          {/* Meta Tags */}
          <meta name="msapplication-TileColor" content="#ffffff" />
          <meta name="msapplication-TileImage" content="/ms-icon-144x144.png" />
          <meta name="theme-color" content="#171717" />
          <meta name="Magic Training" content="Magic Training" />
          <meta name="twitter:card" content="summary_large_image" />

          <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3219622306351483"
            crossOrigin="anonymous"></script>
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
