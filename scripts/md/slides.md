title: Presenters
class: big
build_lists: true

<!---

  eZ Summercamp 2014 Talk

  Learnings from Real eZ Publish 5 Projects

  (c) 2014 Ekkehard Dörre, Donat Fritschy

-->

* <strong>Donat</strong> is owner of Webmanufaktur, a full service web agency in Switzerland. He works as projects manager, software architect and developer and likes thinking outside of the box. In the last year he has been involved in major eZ 5 projects.
* <strong>Ekke</strong> is a consultant with deep knowledge in eZ Publish 4 and 5, eZ Find / Apache Solr and with a faible for coming cutting edge web technologies. He is one of the organizers of the PHP Unconference since eight years.
* Members of CJW Network

---

title: Learnings from Real eZ Publish 5 Projects
class: big
build_lists: true

- Last year we have presented our Cookbok...
- ... today you get a Ratatouille ;-)

- Let's share the experiences you and we made in the last year!

---

title: Agenda
class: big
build_lists: true

Things we would like to discuss:

- Good Practice
- ez View Cache vs. HTTP Cache
- Debugging
- Pitfalls
- MultiSite Setup

---

title: Good Practice
subtitle:
class: segue dark nobackground

---

title: Team up with a Symfony Crack
build_lists: true

- To be honest: as eZ 4 developers, we are complete novices in eZ 5
- It's easier for a Smyfony Crack to learn eZ than other way round
- Symfony community is hungry for a CMS, so watch out for new competition
- But @Symfony cracks: It's not easy: an eZ Publish and CMS expert will reduce your risk
- and will make your content architecture better and more maintainable
---

title: Think in MVC
build_lists: true

- A radical different thinking
- eZ 4 mangled all together in the TPL -&gt; the view implemented the logic (fetch)
- Symfony enforces a clean separation, from routing to the controller to the rendering of the view

---

title: MVC Blackbox

<img src="images/mvc.jpg" alt="" width="800" style="margin-top:-40px">

---

title: Think in Bundles
build_lists: true

*What is a bundle?*

- Use a least one bundle per site
- Split your application in different bundles (site specific, functional, ...)
- Reuse your code: create and maintain with love a Base Bundle with general functions

- Creating bundles is easy, don't work in the DemoBundle ;-)
<li>
<pre class="prettyprint" data-lang="bash">
$ php ezpublish/console generate:bundle
</pre>
</li>

---

title: Organize your config files
build_lists: true

The standard eZ installation is a mess...

... and the DemoBundle only slowly becoming a source of good practice

*How do YOU handle this?*

- keep config in `ezpublish/config` as general as possible
- it should merely describe your environment, not the application
- move all site/function specific settings to the bundle

---

title: Keep ezpublish.yml small (1)
class: smaller

`ezpublish/config/ezpublish.yml`

<pre class="prettyprint" data-lang="yml">
imports:
    - {resource: "@CjwExampleBundle/Resources/config/ezpublish.yml"}
ezpublish:
    siteaccess:
        default_siteaccess: %cjw.site%_user
        list:
        groups:
            default_group:
        match:
            \Cjw\MultiSiteBundle\Matcher\MapHost:
                www.frb.ch: %cjw.site%_user
                admin.frb.ch: %cjw.site%_admin
    repositories:
        default_repository:
            engine: legacy
            connection: default_connection
</pre>

---

title: Keep ezpublish.yml small (2)
class: smaller

<pre class="prettyprint" data-lang="yml">
    system:
        default_group:
            repository: default_repository
            var_dir: var/%cjw.site%
            languages:
                - ger-DE
        %cjw.site%_user:
            legacy_mode: false
            languages:
                - ger-DE
            content:
                view_cache: true
                ttl_cache: true
                default_ttl: 3600
        %cjw.site%_admin:
            legacy_mode: true
            ...
stash:
    ...
</pre>

---

title: Keep ezpublish.yml small (3)

Can even be shorter - get inspiration from <https://github.com/lolautruche/metalfrance>

Extras:

- use parameters
- standardize site access names, groups, repository names

`ezpublish/config/parameters.yml`

<pre class="prettyprint" data-lang="yml">
parameters:
    ...
    cjw.site: frb
</pre>

*Note: prepending configuration does not work well with parameters*

---

title: Config Files in Bundle

We keep them in a separate directory and name them as in good old eZ...

<pre>
ExampleBundle
&#8990; Resources
  &#8990; config
    &#8990; ezpublish
        image.yml
        override.yml
      ezpublish.yml         &lt;-- includes files from ./ezpublish
      parameters.yml
      routing.yml
      services.yml
</pre>

---

title: Controllers
build_lists: true

After several tries, we ended up with...

- Basically one controller per full view
- Separate controllers for navigation etc.
- Consider caching (TTL, X-Location Header)

- **Recommended: Move business logic to separate model**
- Retrieve all needed data (location, children, ...)
- Prepare the data for easy processing in the templates

---

title: Ways to Fetch Content
build_lists: true

- LocationService::loadLocation( $id )
- ContentService::loadContent( $id )

- SearchService::findContent( $query )
- SearchService::findLocations( $query )

- LocationService::loadLocationChildren( $location )

- Legacy fetch functions

---

title: SearchService::findContent()
build_lists: true

The only `SearchService` function you will find in `DemoBundle` ...

- returns full `content` objects with ALL attributes in ALL languages
- does not work <s>well</s> with multiple locations
- no `as_objects` flag as in eZ 4

- scales very badly
- fetching a content tree with 116 locations took 30 seconds
- most of the time is spent in manipulating the SQL result in PHP
- Another test: 24 hits, PHP array 44'880 rows with 39 elements each, highly redundant

- <http://share.ez.no/blogs/donat-fritschy/searchservice-performance>

---

title: SearchService::findLocations()
build_lists: true

**Available from 2014.05 / 5.3 only**

Roughly equivalent to good old `fetch( 'content', 'list' )`

- returns `location` objects with `contentInfo` only
- usually sufficient for building a menu
- use `ContentService::loadContent()` to fetch whole object
- Performance lower than legacy, but acceptable
- fetching a content tree with 116 locations took &lt; 1 second
- scales very well

---

title: LocationService::loadLocationChildren()

Think of `LocationService::loadLocationChildren()` as primarily intended for administration interface. Has no filtering capabilities.

Further reading:

<http://www.netgenlabs.com/Blog/Fetching-content-in-eZ-Publish-5-using-Search-service>

---

title: Legacy Fetch Functions
class: smaller

<pre class="prettyprint" data-lang="php">
use eZFunctionHandler;
...
$mySearchResults = $this->getLegacyKernel()->runCallback(
    function () use ( $searchPhrase, $sort, $contentTypeIdenfiers )
    {
        // eZFunctionHandler::execute is the equivalent for a legacy template fetch function
        // The following is the same than fetch( 'ezfind', 'search', hash(...) )
        return eZFunctionHandler::execute(
            'ezfind',
            'search',
            array(
                'query'     => $searchPhrase,
                'sort_by'   => $sort,
                'class_id'  => $contentTypeIdenfiers
            )
        );
    }
);
</pre>

---

title: Templates

How to transform a full view TPL with children to Symfony?

`full/folder.tpl`

<pre class="prettyprint" data-lang="tpl">
&lt;h1&gt;{$node.data_map.title.content|wash()}&lt;/h1&gt;
{attribute_view_gui attribute=$node.data_map.short_description}
...

{def $list_items=fetch( 'content', 'list', ... ) ) }

{foreach $list_items as $child}
    {node_view_gui view=line content_node=$child}
{/foreach}
</pre>

---

title: Moving to TWIG
class: smaller

`Resources/view/full.html.twig`
<pre class="prettyprint" data-lang="Twig">
&lt;h1&gt;{{ ez_render_field( content, 'title') }}&lt;/h1&gt;
{{ ez_render_field( content, 'short_description') }}
...
{{ render( controller( "CjwBaseBundle:Default:subItems", {'locationId': location.id }) ) }}
</pre>
`Controller/DefaultController.php`
<pre class="prettyprint" data-lang="php">
public function subItemsAction( $locationId )
{
    $response = new Response;
    $locationList = $this->fetchLocationListIncludingContentTypes( $locationId, array() );
    return $this->render(
                "CjwBaseBundle::sub_items.html.twig",
                    array( "locationList" => $locationList ),
                    $response
    );
}
</pre>

---

title: Moving to TWIG

`Resources/view/sub_items.html.twig`
<pre class="prettyprint" data-lang="Twig">
{% for location in locationList %}
    {{ render( controller( 'ez_content:viewLocation',
       {'locationId': location.id, 'viewType': 'line'} ))  }}
{% endfor %}
</pre>

---

title: Our approach

- Basically one template per full view
- Render children directly in the full view template
- Generalized full and line view templates for the easy stuff

---

title: How to organize Templates?

The Symfony way...

<pre>
views
&#8990; Customer
    CustomerDetail.html.twig
&#8990; Product
</pre>

The classic eZ way...

<pre>
views
&#8990; full
    customer.html.twig
&#8990; line
</pre>

Two approaches, both valid. Follow your taste.

---

title: eZ View Cache vs. HTTP Caching
subtitle:
class: segue dark nobackground

---

title: eZ View Caching (Legacy)

When the pagelayout is rendered, the `{$module_result.content}` part will be replaced with the actual output. If view caching is enabled, the entire result of the module will be cached. This means that the contents of the "module_result" variable will be put into a cache file (...)

When a new version (...) of an object is published, the system will automatically clear the view cache for the following items:

* All published nodes of the object
* The parent nodes
* Related nodes (keywords, object relations)

<https://doc.ez.no/eZ-Publish/Technical-manual/4.x/Features/View-caching>

---

title: HTTP Expiration and Validation (Symfony)
build_lists: true

The HTTP specification defines two caching models:

* With the **expiration model**, you simply specify how long a response should be considered "fresh" by including a Cache-Control and/or an Expires header. Caches that understand expiration will not make the same request until the cached version reaches its expiration time and becomes "stale";
* When pages are really dynamic (i.e. their representation changes often), the **validation model** is often necessary. With this model, the cache stores the response, but asks the server on each request whether or not the cached response is still valid. The application uses a unique response identifier (the Etag header) and/or a timestamp (the Last-Modified header) to check if the page has changed since being cached.

<http://symfony.com/doc/current/book/http_cache.html>

---

title: In Short (and much simplified...)

eZ View Cache caches **content** and **content fragments**

* Standard TTL is 2 hours
* Is purged on content modifications (with smart cache clearing rules)

Symfony's HTTP Cache caches **requests**

* eZ uses Expiration model by default
* Standard TTL is 60 seconds (86400 for tree menu!)
* Symfony Cache is purged from backend, **but only for ONE location**

Let's dive in a bit deeper...

---

title: ez 4 Cache Directives

Code from `ezpublish_legacy/kernel/private/classes/ezpkernelweb.php`

<pre class="prettyprint" data-lang="php">
// send header information
foreach (
    eZHTTPHeader::headerOverrideArray( $this->uri ) +
    array(
        <b>'Expires' => 'Mon, 26 Jul 1997 05:00:00 GMT',
        'Last-Modified' => gmdate( 'D, d M Y H:i:s' ) . ' GMT',
        'Cache-Control' => 'no-cache, must-revalidate',
        'Pragma' => 'no-cache',</b>
        ...
      ) as $key => $value
)
{
    header( $key . ': ' . $value );
}
</pre>

**This guarantees that every request is handled by eZ**

---

title: eZ 5 Cache Directives

Code from `vendor/ezsystems/demobundle/EzSystems/DemoBundle/Controller/DemoController.php`

<pre class="prettyprint" data-lang="php">
// Setting HTTP cache for the response to be public and with a TTL of 1 day.
$response = new Response;
$response->setPublic();
$response->setSharedMaxAge( 86400 );
// Menu will expire when top location cache expires.
$response->headers->set( 'X-Location-Id', $rootLocationId );
// Menu might vary depending on user permissions, so make the cache vary on the user hash.
$response->setVary( 'X-User-Hash' );
</pre>

**This effectively sets the Response free, out of the reach of eZ**

---

title: Emulating eZ 4 Cache behaviour in eZ 5

This patch to `index.php` disables client and proxy caching without sacrificing the benefits of the Symfony HTTP cache. Use at own risk!

<pre class="prettyprint" data-lang="php">
$response = $kernel->handle( $request );
<b>
// Emulate eZ 4 cache control
$response->headers->set( 'Cache-Control', 'no-cache, must-revalidate' );
</b>
$response->send();
$kernel->terminate( $request, $response );
</pre>

---

title: Cache Recommendations
build_lists: true

* Read the specifications
* Use Shared Caches with caution
* Cave: `setTtl()` vs. `setClientTtl`
* Set TTL as high as possible
* Use Varnish

* <http://tools.ietf.org/html/rfc2616#page-74>
* <https://www.mnot.net/cache_docs/>

---

title: Cache per User - User Hash Definer
class: smaller

`src/Cjw/SiteCustomerBundle/Identity/UserHashDefiner.php`
<pre class="prettyprint" data-lang="php">
namespace Cjw\SiteCustomerBundle\Identity;
use eZ\Publish\SPI\User\IdentityAware;
use eZ\Publish\SPI\User\Identity;
use eZ\Publish\API\Repository\Repository;
class UserHashDefiner implements IdentityAware
{
    private $repository;
    public function __construct(Repository $repository)
    {
        $this->repository = $repository;
    }
    public function setIdentity(Identity $identity)
    {
        $current_user = $this->repository->getCurrentUser();
        $identity->setInformation('UserID', $current_user->contentInfo->id);
    }
}
</pre>

---

title: Cache per User - yml config

`src/Cjw/SiteCustomerBundle/Ressources/config/services.yml`

<pre class="prettyprint" data-lang="yml">

parameters:
    cjw_site_customer.user_hash_definer.class: Cjw\SiteCustomerBundle\Identity\UserHashDefiner

services:
    cjw_site_customer.user_hash_definer:
        class: %cjw_site_customer.user_hash_definer.class%
        tags:
          - { name: ezpublish.identity_definer }
        arguments: [@ezpublish.api.repository]

</pre>

---

title: Cache per User - Controller

`src/Cjw/SiteCustomerBundle/Controller/CjwController.php`

<pre class="prettyprint" data-lang="php">

    public function sectionInternalAction($locationId, $viewType, $layout = false, array $params = array())
    {
        $response = new Response();
        $response->setPrivate();
        $response->headers->set('X-Location-Id', $locationId);
        $response->setVary('X-User-Hash');
        return $response;
    }
</pre>

---

title: Cache per User - Location View Configuration

`src/Cjw/SiteCustomerBundle/Ressources/config/ezpublish/override.yml`

<pre class="prettyprint" data-lang="yml">

system:
    customer_user_de:
        location_view:
            full:
                section_internal:
                    controller:  "CjwSiteCustomerBundle:Cjw:sectionInternal"
                    match:
                        Identifier\Section: internal

</pre>

---

title: Debugging
subtitle: Coping with blank screens
class: segue dark nobackground

---

title: Blank screen, "503 Service not available"

* PHP errors (Syntax error, Memory, Outdated Autoloads, ...)
* Configuration errors (DB connection, ...)

* Switch to DEV mode for better debugging
* Check the log files
<pre>
    Apache/PHP Log
    ezpublish/logs/&lt;env&gt;.log
    ezpublish_legacy/var/log/\*
    ezpublish_legacy/var/&lt;siteaccess&gt;/log/\*
</pre>
* Check write permissions on log files!

---

title: TwigBundle:Exception:error500.html.twig

* NEVER a Twig error!
* Caused by response 500 "Internal Server Error" and missing error template

* Checks as before

---

title: Twig Exception: Invalid variation "&lt;variation&gt;"

Caused by problems when accessing images

* Check if the file exists
* Check permissions on `ezpublish_legacy/var/<siteaccess>/storage`
* Check log files
* Clear cache

---

title: Class 'ezxFormToken' not found

* Usually found with fresh installations involving legacy extensions
* Regenerate Autoloads

<pre class="prettyprint" data-lang="bash">
$ cd ezpublish_legacy
$ php bin/php/ezpgenerateautoloads.php -e -p
</pre>

---

title: Pitfalls
subtitle: Avoid the traps...
class: segue dark nobackground

---

title: Memory limit exceeded in DEV mode

* DEV mode takes a lot of memory
* Stash Logging is the worst
* Disable Stash Logging in ezpublish.yml

<pre class="prettyprint" data-lang="yml">
stash:
    <b>logging: false</b>
    caches:
        default:
            handlers:
                - FileSystem
            inMemory: true
            registerDoctrineAdapter: false
</pre>

---

title: 414 Request-URI Too Long

When doing subrequests, particularly ESI or Hinclude ones, current SiteAccess is transmitted in a serialized form, with its matcher. With a large number of configured SiteAccesses using Map\Host or Map\URI matcher (around 40, which is not uncommon for a multi-national, multi-lingual site) the URL can exceed the size of 8192 Bytes which most servers accept. As a result, the ESI/Hinclude call fails.

* Fixed in Version 5.3.3 (2014.07)
* <https://jira.ez.no/browse/EZP-23168>
* <https://github.com/ezsystems/ezpublish-kernel/pull/949>

---

title: Multi-Site/Multi-Repository Setup
subtitle:
class: segue dark nobackground

---

title: Why a Multi-Site/Multi-Repository Setup?

* At CJW Network we have developed a multi-site/multi-repository setup for eZ Publish 4 several years ago
* This allows us to host many individual sites on a single eZ Publish installation

Advantages:

* Central site administration (site activation, cronjobs, ...)
* Easy deployment (update site extension with Subversion)
* Highly reduced maintenance costs (security patches, upgrades)
* Highly efficient use of hardware resources

Disadvantages:

* Some Kernel patches needed

---

title: Multi-Site/Multi-Repository Setup in eZ 5

First Approach (proven in production)

* Use different `ezpublish` app directories to host the different sites

Second approach (under development)

* Use `CJW MultiSiteBundle`

---

title: Directory structure - Multi-Site-Setup (old)

<pre class="">
ezpublish                &lt;-- not used
ezpublish_legacy
&#8990;extension
 &#8990;site_customer          &lt;-- each customer has its own extension and database
 &#8990;site_customertwo
&#8990;var
 &#8990;site_customer          &lt;-- each customer has its own var directory
 &#8990;site_customertwo
site_customer            &lt;-- each customer has its own Symfony app
site_customertwo
src
&#8990;CjwNetwork
 &#8990;SiteCustomerBundle     &lt;-- each customer has its own bundle
 &#8990;SiteCustomertwoBundle
</pre>

---

title: Multi-Site-Setup (old) Detail ezpublish_legacy

<pre class="">
ezpublish_legacy
&#8990;extension
 &#8990;site_customer          &lt;-- each customer has its own extension
  &#8990;classes
  &#8990;design
  &#8990;modules
  &#8990;settings
   &#8990;site.ini
    &#8990;[DatabaseSettings]  &lt;-- each customer has its own database
     &#8990;Database=database_site_customer
 &#8990;site_customertwo
  &#8990;[...]
  &#8990;settings
   &#8990;site.ini
    &#8990;[DatabaseSettings]
     &#8990;Database=database_site_customertwo
&#8990;var
 &#8990;site_customer          &lt;-- each customer has its own var directory
 &#8990;site_customertwo
</pre>

---

title: Detail site_customer App - Multi-Site-Setup (old)

<pre class="">
site_customer
&#8990;autoload.php
&#8990;bootstrap.php.cache
&#8990;cache
&#8990;check.php
&#8990;config    &lt;-- all yml files like ezpublish folder, (to improve)
 &#8990;config.yml
 &#8990;ezpublish.yml
&#8990; parameters.yml
&#8990;console
&#8990;logs
&#8990;phpunit.xml.dist
&#8990;Resources
&#8990;sessions
&#8990;SiteCjwbaseCache.php
&#8990;SiteCjwbaseKernel.php
&#8990;SymfonyRequirements.php
</pre>

---

title: Scripts on Shell - Multi-Site-Setup (old)

<pre class="prettyprint" data-lang="bash">
# Generate symlinks
php site_customer/console assets:install --symlink web
php site_customer/console ezpublish:legacy:assets_install --symlink web

# Clear Cache
php site_customer/console --env=prod cache:clear

# Dump assets
php site_customer/console assetic:dump --env=prod web

# Run cronjobs
php site_customer/console ezpublish:legacy:script runcronjobs.php --siteaccess customer_user_de cjw_newsletter
</pre>

---

title: Multiple Apps: Multi-Site-Setup (old)
build_lists: true

* You can use one development environment with many projects
* You can use one or more production servers  or
* easily check out customer to different servers
* all customer are encapsulated apps
* solid and proven for more than 1,5 years
* Examples ...

---

title: Introducing CJW MultiSiteBundle
build_lists: true

Although the first approach works fine, it has several drawbacks:

* Application code scattered at different places (site directory, bundle, legacy extension), hard to maintain in VCS, hard to deploy
* Redundancy in config files
* No global settings
* No central site activation/administration

* Goal: keep everything in one place!

---

title: CJW MultiSiteBundle Features
build_lists: true

* Boots kernel and environment based on domain name mappings
* Handles local, staging and live domain names
* Allows for global activation of bundles
* Allows for global settings
* Provides a common console for all sites
* Caches domain name mappings
* Moves cache and log files away from the ezpublish folder
* more to come ...

---

title: cjwpublish Directory

The `cjwpublish` application directory sits next to the `ezpublish` directory.

<pre class="">
cjwpublish
&#8990; config
    cjwpublish.yml                  &lt;-- defines active bundles
    config.yml                      &lt;-- allows for global settings
  CjwPublishKernel.php              &lt;-- inherits from CjwMultiSiteKernel.php
  CjwPublishCache.php               &lt;-- inherits from CjwMultiSiteCache.php
  console
</pre>

---

title: Symfony's app directory is back

Site Bundle Directory Layout

<pre class="">
src
&#8990; Cjw
  &#8990; SiteExampleBundle
    &#8990; app
      &#8990; config
          cjwpublish.yml            &lt;-- contains domain mappings
          config.yml
          ezpublish.yml
          ...
        CjwSiteExampleKernel.php    &lt;-- inherits from CjwPublishKernel.php
        CjwSiteExampleCache.php     &lt;-- inherits from CjwPublishCache.php
    &#8990; Controller
      ...
</pre>

---

title: Caveats

Adjustments needed in `config.yml` to reflect different relative location of kernel

<pre class="prettyprint" data-lang="yml">
assetic:
    ...
    read_from:      %kernel.root_dir%/../../../../web
    write_to:       %kernel.root_dir%/../../../../web
    ...
ez_publish_legacy:
    ...
    root_dir: %kernel.root_dir%/../../../../ezpublish_legacy

parameters:
    ezpublish.kernel.root_dir: %kernel.root_dir%/../../../../vendor/ezsystems/ezpublish-kernel
</pre>

**More problems of this kind expected!**

---

title: Project Status

* Currently in private Beta, not yet released
* Ideas and Feedback welcome
* Public Beta in October

* <mailto:info@cjw-network.com>
* <https://github.com/cjw-network/MultiSiteBundle>

---

title: Ressources

Slides as PDF

* see `src/Cjw/SummerCampBundle/Resources/doc/learnings.pdf`
* <https://github.com/cjw-network/SummerCampBundle/Resources/doc/learnings.pdf>

Slides (Source)

* <https://github.com/dfritschy/cjw-summercamp-slides>

CJW MultiSiteBundle

* <https://github.com/cjw-network/MultiSiteBundle>
* <mailto:info@cjw-network.com>

---

title: <a href="http://vote.netgenlabs.com/" style="color:#fff;">http://vote.netgenlabs.com/</a>
subtitle: Please Vote!
class: segue dark nobackground


