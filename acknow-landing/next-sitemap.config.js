/** @type {import('next-sitemap').IConfig} */
module.exports = {
    siteUrl: 'https://acknow.cloud',
    generateRobotsTxt: true,
    sitemapSize: 7000,
    changefreq: 'daily',
    priority: 1.0,
    robotsTxtOptions: {
        policies: [
            {
                userAgent: '*',
                allow: '/',
            },
        ],
        additionalSitemaps: [
            'https://acknow.cloud/sitemap.xml',
        ],
    },
};
