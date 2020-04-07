<script>
  import { onMount } from "svelte";
  import { Router, Route, navigate } from "svelte-routing";
  import { Breadcrumb, EntityHeader, Issuers, Faculties } from "../teachers";
  import { institutionIcon, issuerIcon, facultyIcon } from "../../icons";
  import { queryData } from "../../api/graphql";

  export let entityId;
  export let subEntity;

  let faculty = {};
  let institutionName = "";
  let issuers = [];

  const query = `{
    faculty(id: "${entityId}") {
		name,
		entityId,
		institution {
			name
		},
		issuers {
      name,
      entityId,
			badgeclasses {
				entityId
			}
		}
	}
  }`;

  onMount(() => {
    queryData(query).then(res => {
      faculty = res.faculty;
      institutionName = res.faculty.institution.name;
      issuers = res.faculty.issuers;
    });
  });

  const tabs = [
    {
      entity: "issuers",
      href: `/manage/faculty/${entityId}/issuers`,
      icon: issuerIcon
    }
  ];

  $: if (!subEntity) navigate(tabs[0].href, { replace: true });
</script>

<style>
  .page-container {
    flex: 1;
    --entity-icon-width: 66px;
  }
</style>

<div class="page-container">
  <Breadcrumb {institutionName} {faculty} />
  <EntityHeader
    {tabs}
    title={faculty.name}
    icon={facultyIcon}
    entity="faculty" />

  <Router>
    <Route path="/issuers">
      <Issuers {issuers} facultyName={faculty.name} />
    </Route>
  </Router>
</div>