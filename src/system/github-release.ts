// incomplete
export interface GithubRelease {
    url: string;
    name: string;
    tag_name: string;
    prerelease: boolean;
    html_url: string;
    tarball_url: string;
    assets: [{
        browser_download_url: string
    }]
}