<script>
  import I18n from "i18n-js";
  import {navigate} from "svelte-routing";
  import {EntityForm} from "../teachers";
  import {Field, Select, File, TextInput, AddButton} from "../forms";
  import {createBadgeclass, editBadgeclass} from "../../api";
  import ExpirationSettings from "./ExpirationSettings.svelte";
  import {isEmpty} from "lodash";
  import {
    ects,
    educationProgramIdentifier,
    eqf,
    extensionToJson,
    extensionValue,
    language,
    learningOutcome,
    studyLoad,
  } from "../extensions/badges/extensions";
  import EctsCreditPoints from "../extensions/badges/EctsCreditPoints.svelte";
  import {setExpirationPeriod} from "../extensions/badges/expiration_period";
  import {addAlignment} from "../extensions/badges/alignment";
  import {trash} from '../../icons';
  import {entityType} from "../../util/entityTypes";
  import {toHttpOrHttps} from "../../util/Url";

  export let entityId;
  export let badgeclass = {extensions: [], issuer: {}};
  export let issuers = [];
  export let mayDelete;
  export let mayEdit;
  export let hasUnrevokedAssertions;
  export let institution = {};

  const isCreate = !entityId;
  const entity = entityType.BADGE_CLASS;

  let expireValueSet = false;
  let loaded = false;
  let processing = false;

  let showStudyLoad = false;
  let showEducationalIdentifiers = false;
  let showAlignment = false;

  let alignment = {
    target_name: "",
    target_url: "",
    target_description: "",
    target_framework: "",
    target_code: ""
  };

  if (!isEmpty(badgeclass.alignments)) {
    alignment = {
      target_name: badgeclass.alignments[0].targetName,
      target_url: badgeclass.alignments[0].targetUrl,
      target_description: badgeclass.alignments[0].targetDescription,
      target_framework: badgeclass.alignments[0].targetFramework,
      target_code: badgeclass.alignments[0].targetCode
    };
    showAlignment = true;
  }

  let ectsOrHours = [
    {name: I18n.t(['models', 'badgeclass', 'ects', 'creditPoints']), value: 'creditPoints'},
    {name: I18n.t(['models', 'badgeclass', 'ects', 'hours']), value: 'hours'},
  ];
  let ectsOrHoursSelection = ectsOrHours[0];

  let errors = {};

  const languages = [{value: "en_EN", name: I18n.t("language.en_EN")}, {
    value: "nl_NL",
    name: I18n.t("language.nl_NL")
  }];
  let languageSelection = languages[0];
  if (!isCreate) {
    languageSelection = languages.find(x => x.value === extensionValue(badgeclass.extensions, language));
  }

  const eqfItems = [...Array(8).keys()].map(i => {
    return {name: `NLQF ${i + 1}`, value: i + 1}
  });

  let extensions = {};

  const addStudyLoad = () => {
    extensions[ects.name] = 2.5;
    showStudyLoad = true;
  }

  $: if (badgeclass.extensions.length > 0 && !loaded) {
    const studyLoadValue = extensionValue(badgeclass.extensions, studyLoad);
    extensions = {
      [language.name]: extensionValue(badgeclass.extensions, language) || "en_EN",
      [ects.name]: extensionValue(badgeclass.extensions, ects) || (isCreate ? 2.5 : ""),
      [eqf.name]: extensionValue(badgeclass.extensions, eqf) || {name: "NLQF 5", value: 5},
      [learningOutcome.name]: extensionValue(badgeclass.extensions, learningOutcome) || "",
      [educationProgramIdentifier.name]: extensionValue(badgeclass.extensions, educationProgramIdentifier) || "",
      [studyLoad.name]: studyLoadValue || "",
    };
    if (extensions[eqf.name] && typeof extensions[eqf.name] === "number") {
      extensions[eqf.name] = {name: `NLQF ${extensions[eqf.name]}`, value: extensions[eqf.name]}
    }
    if (extensions[educationProgramIdentifier.name]) {
      showEducationalIdentifiers = true;
    }
    if (institution.grondslagFormeel !== null && (extensions[ects.name] || extensions[studyLoad.name] || isCreate)) {
      showStudyLoad = true;
      ectsOrHoursSelection = studyLoadValue ? ectsOrHours[1] : ectsOrHours[0];
    }
    loaded = true;
  }

  function onSubmit() {
    errors = {};
    processing = true;

    let newBadgeclass = {
      ...badgeclass,
      criteria_text: badgeclass.criteriaText,
      criteria_url: toHttpOrHttps(badgeclass.criteriaUrl),
    };
    setExpirationPeriod(newBadgeclass);

    if (showAlignment) {
      addAlignment(newBadgeclass, alignment);
    } else {
      newBadgeclass.alignments = [];
    }
    newBadgeclass.extensions = extensionToJson([
      {name: language.name, value: languageSelection.value}
    ]);
    const learningOutcomeValue = extensions[learningOutcome.name];
    if (learningOutcomeValue) {
      const learningOutcomeExt = extensionToJson([
        {name: learningOutcome.name, value: learningOutcomeValue}
      ]);
      newBadgeclass.extensions = {...newBadgeclass.extensions, ...learningOutcomeExt}
    }
    if (showEducationalIdentifiers) {
      const educationalIdentifiers = extensionToJson([
        {name: eqf.name, value: extensions[eqf.name].value},
        {
          name: educationProgramIdentifier.name,
          value: parseInt(extensions[educationProgramIdentifier.name], 10)
        }]);
      newBadgeclass.extensions = {...newBadgeclass.extensions, ...educationalIdentifiers};
    }
    if (showStudyLoad) {
      if (ectsOrHoursSelection.value === "hours") {
        newBadgeclass.extensions = {
          ...newBadgeclass.extensions,
          ...extensionToJson([{name: studyLoad.name, value: parseInt(extensions[studyLoad.name])}])
        }
      } else {
        newBadgeclass.extensions = {
          ...newBadgeclass.extensions,
          ...extensionToJson([{name: ects.name, value: extensions[ects.name]}])
        }
      }
      newBadgeclass.formal = true;
    } else {
      newBadgeclass.formal = false;
    }
    if (badgeclass.issuer) {
      newBadgeclass.issuer = badgeclass.issuer.entityId;
    }
    const args = isCreate ? [newBadgeclass] : [entityId, newBadgeclass];
    const apiCall = isCreate ? createBadgeclass : editBadgeclass;

    apiCall(...args)
      .then(res => {
        navigate(`/manage/badgeclass/${res.entity_id}`)
      })
      .catch(err => err.then(({fields}) => {
        processing = false;
        errors = fields.error_message;
        if (errors.extensions) {
          for (const ext of errors.extensions) {
            const ext_name = ext.error_message.split(' ')[1].split(':')[1];
            if (ext_name === "StudyLoadExtension") errors[ext_name] = [{'error_code': 906}];
            if (ext_name === "EducationProgramIdentifierExtension") errors[ext_name] = [{'error_code': 909}];
          }
        }
        if (errors.alignments) {
          errors = {...errors, ...fields.error_message.alignments[0]}
        }
      }));
  }
</script>

<style lang="scss">
  div.form {
    display: grid;
    grid-template-columns: 50% 50%;
    grid-row: auto;
    grid-column-gap: 40px;
    grid-row-gap: 16px;
    padding-right: 40px;

  }

  @media (max-width: 820px) {
    div.form {
      grid-template-columns: 100%;
    }
  }

  h4 {
    color: var(--purple);
    padding: var(--ver-padding-s) var(--ver-padding-m);
    font-size: 20px;
    border-left: 3px solid var(--purple-2);
    margin: var(--ver-padding-l) 0;
  }

  span.info {
    display: inline-block;
    margin-bottom: 6px;
    font-size: 14px;
  }

  .deletable-title {
    display: inline-block;
  }

  .add-buttons {
    margin-bottom: 30px;
  }

  .add-button {
    margin-right: 20px;
  }

  .rm-icon-container {
    border: none;
    background-color: inherit;
    color: purple;
    display: inline-block;
    height: 30px;
    width: 30px;
    margin: 0 0 5px 0;
    align-self: center;
    cursor: pointer;
  }

  .disabled {
    cursor: not-allowed !important;
    color: var(--grey-7);
  }
</style>

<EntityForm
  entityTypeName={entity}
  parentId={badgeclass.issuer.entityId}
  {mayDelete}
  {mayEdit}
  {hasUnrevokedAssertions}
  entityId={entityId}
  issuer={isCreate ? null : badgeclass.issuer}
  faculty={isCreate ? null : badgeclass.issuer.faculty}
  badgeclass={isCreate ? null : badgeclass}
  badgeclassName={isCreate ? null : badgeclass.name}
  submit={onSubmit}
  create={isCreate}
  {processing}>

  <h4>{I18n.t("models.badgeclass.headers.basicInformation")}</h4>

  <div class="form">

    <Field {entity} attribute="image" errors={errors.image}>
      <File
        bind:value={badgeclass.image}
        disabled={!mayEdit}
        error={errors.image}
        removeAllowed={false}/>
    </Field>

    <ExpirationSettings
      bind:expireValueSet={badgeclass.expireValueSet}
      disabled={!mayEdit}
      className=""
      bind:number={badgeclass.expirationDuration}
      bind:period={badgeclass.expirationPeriod}/>

    <Field {entity} attribute="name" errors={errors.name}>
      <TextInput bind:value={badgeclass.name} disabled={!mayEdit} error={errors.name} placeholder={I18n.t("placeholders.badgeClass.name")}/>
    </Field>

    <Field {entity} attribute="language" errors={errors.language}>
      <Select
        bind:value={languageSelection}
        items={languages}
        disabled={!mayEdit}
        optionIdentifier="value"
        clearable={false}/>
    </Field>

    <Field {entity} attribute="description" errors={errors.description}>
      <TextInput
        bind:value={badgeclass.description}
        error={errors.description}
        disabled={!mayEdit}
        area
        placeholder={I18n.t("placeholders.badgeClass.description")}
        size="100"
      />
    </Field>

    <Field {entity} attribute="learningOutcome" errors={errors.learningOutcome}>
      <TextInput
        bind:value={extensions[learningOutcome.name]}
        disabled={!mayEdit}
        error={errors.learningOutcome}
        area
        placeholder={I18n.t("placeholders.badgeClass.learningOutcome")}
        size="100"
      />
    </Field>

    <Field {entity} attribute="issuer" errors={errors.issuer}>
      <Select
        bind:value={badgeclass.issuer}
        error={errors.issuer}
        disabled={true}
        clearable={false}
        items={issuers}/>
    </Field>

  </div>

  <h4>{I18n.t('models.badgeclass.headers.earningCriteria')}</h4>

  <div class="form">
    <Field {entity} attribute="criteria_text" errors={errors.criteria_text}>
      <TextInput
        area
        bind:value={badgeclass.criteriaText}
        disabled={!mayEdit}
        placeholder={I18n.t("placeholders.badgeClass.criteriaText")}
        error={errors.criteria_text}
        size="150"
      />
    </Field>

    <Field {entity} attribute="criteria_url" errors={errors.criteria_url}>
      <TextInput
        bind:value={badgeclass.criteriaUrl}
        disabled={!mayEdit}
        placeholder={I18n.t("placeholders.badgeClass.criteriaUrl")}
        error={errors.criteria_url}/>
    </Field>
  </div>

  {#if showStudyLoad}
    <div style="display: flex">
      <div class="deletable-title"><h4>{I18n.t('models.badgeclass.headers.studyLoad')}</h4></div>
      {#if institution.grondslagInformeel !== null}
          {#if mayEdit}
            <button class="rm-icon-container" on:click={() => showStudyLoad = false}>{@html trash}</button>
          {:else}
            <button class="rm-icon-container disabled" >{@html trash}</button>
          {/if}
      {/if}
    </div>

    <div class="form">
      <Field {entity} attribute="typeOfStudyLoad" errors={errors.type}>
        <Select
          bind:value={ectsOrHoursSelection}
          items={ectsOrHours}
          disabled={!mayEdit}
          optionIdentifier="value"
          clearable={false}
        />
      </Field>
      <p></p>
      {#if ectsOrHoursSelection.value === 'creditPoints'}
        <Field {entity} attribute="number" errors={errors.ectsLong}>
          <EctsCreditPoints 
            bind:ectsValue={extensions[ects.name]}
            disabled={!mayEdit} 
          />
        </Field>
      {:else}
        <Field {entity} attribute="number" errors={errors.StudyLoadExtension}>
          <TextInput
              type="number"
              bind:value={extensions[studyLoad.name]}
              error={errors.StudyLoadExtension}
              disabled={!mayEdit}
              placeholder={I18n.t("placeholders.badgeClass.studyLoad")}/>
        </Field>
      {/if}
    </div>
  {/if}

  {#if showEducationalIdentifiers}
    <div style="display: flex">
      <div class="deletable-title"><h4>{I18n.t('models.badgeclass.headers.educationalIdentifiers')}</h4></div>
      {#if mayEdit}
        <button class="rm-icon-container" on:click={() => showEducationalIdentifiers = false}>{@html trash}</button>
      {:else}
        <button class="rm-icon-container disabled" >{@html trash}</button>
      {/if}
    </div>

    <div class="form">
      <Field
        {entity}
        attribute="educationProgramIdentifierLong"
        errors={errors.EducationProgramIdentifierExtension}>
        <TextInput
          type="text"
          bind:value={extensions[educationProgramIdentifier.name]}
          disabled={!mayEdit}
          placeholder={I18n.t("placeholders.badgeClass.educationProgramIdentifier")}
          error={errors.EducationProgramIdentifierExtension}/>
        <span class="info">
          {@html I18n.t('models.badgeclass.info.educationProgramIdentifier')}
        </span>
      </Field>

      <Field {entity} attribute="eqf" errors={errors.eqf}>
        <Select
          bind:value={extensions[eqf.name]}
          items={eqfItems}
          disabled={!mayEdit}
          optionIdentifier="value"
          clearable={false}/>
        <span class="info">
          {@html I18n.t('models.badgeclass.info.eqf')}
        </span>
      </Field>
    </div>
  {/if}

  {#if showAlignment}
    <div style="display: flex">
      <div class="deletable-title"><h4>{I18n.t('models.badgeclass.headers.alignment')}</h4></div>
      {#if mayEdit}
        <button class="rm-icon-container" on:click={() => showAlignment = false}>{@html trash}</button>
      {/if}
    </div>

    <div class="form">
      <Field {entity} attribute="alignmentName" errors={errors.target_name}>
        <TextInput
          bind:value={alignment.target_name}
          disabled={!mayEdit}
          error={errors.target_name}
          placeholder={I18n.t("placeholders.badgeClass.alignmentName")}
        />
      </Field>
      <Field {entity} attribute="alignmentFramework" errors={errors.target_framework}>
        <TextInput
          bind:value={alignment.target_framework}
          disabled={!mayEdit}
          error={errors.target_framework}
          placeholder={I18n.t("placeholders.badgeClass.alignmentFramework")}
        />
      </Field>
      <Field {entity} attribute="alignmentUrl" errors={errors.target_url}>
        <TextInput
          bind:value={alignment.target_url}
          disabled={!mayEdit}
          error={errors.target_url}
          placeholder={I18n.t("placeholders.badgeClass.alignmentUrl")}
        />
      </Field>
      <Field {entity} attribute="alignmentCode" errors{errors.target_code}>
        <TextInput
          bind:value={alignment.target_code}
          disabled={!mayEdit}
          error={errors.target_code}
          placeholder={I18n.t("placeholders.badgeClass.alignmentCode")}
        />
      </Field>
      <Field {entity} attribute="alignmentDescription" errors={errors.target_description}>
        <TextInput
          bind:value={alignment.target_description}
          error={errors.target_description}
          disabled={!mayEdit}
          area
          size="100"
          placeholder={I18n.t("placeholders.badgeClass.alignmentDescription")}
        />
      </Field>
    </div>

  {/if}

  {#if !(showStudyLoad && showEducationalIdentifiers && showAlignment)}
    <h4>{I18n.t('models.badgeclass.headers.additionalSections')}</h4>

    <div class="add-buttons">
      <span class="add-button">
        <AddButton
          text={I18n.t('models.badgeclass.addButtons.educationalIdentifiers')}
          handleClick={() => showEducationalIdentifiers = true}
          visibility={!showEducationalIdentifiers}
          disabled={!mayEdit}
        />
      </span>
      {#if institution.grondslagFormeel !== null}
      <span class="add-button">
        <AddButton
          text={I18n.t('models.badgeclass.addButtons.studyLoad')}
          handleClick={() => addStudyLoad()}
          visibility={!showStudyLoad}
          disabled={!mayEdit}
        />
      </span>
      {/if}
      <span class="add-button">
        <AddButton
          text={I18n.t('models.badgeclass.addButtons.alignment')}
          handleClick={() => showAlignment = true}
          visibility={!showAlignment}
          disabled={!mayEdit}
        />
      </span>
    </div>
  {/if}
</EntityForm>
